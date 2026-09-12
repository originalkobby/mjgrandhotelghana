import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientKey, corsHeaders, json, rateLimit } from "../_shared/delivery.ts";

/**
 * Rider payout ledger. Every money-moving action for riders goes through here
 * so it is role-checked, validated, audited and impossible to trigger from a
 * rider's own session. No real money is ever transferred: staff record what
 * they actually paid.
 */

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in required." }, 401);

    if (!rateLimit(`payouts:${clientKey(req)}`, 60, 60_000)) {
      return json({ error: "Too many requests. Please slow down." }, 429);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData?.user;
    if (!user) return json({ error: "Your session has expired." }, 401);

    const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const roles: string[] = (roleRows ?? []).map((r: any) => r.role);
    const isOps = roles.includes("admin") || roles.includes("operations_manager");
    if (!isOps) return json({ error: "Only managers can handle rider payouts." }, 403);
    const actorRole = roles.includes("admin") ? "admin" : "operations_manager";

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    const audit = (act: string, entityId: string | null, details: Record<string, unknown>) =>
      admin.from("delivery_audit_log").insert({
        actor_id: user.id,
        actor_role: actorRole,
        action: act,
        entity_type: "rider_payout",
        entity_id: entityId,
        details,
      });

    const uuidOk = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

    // ---------- move earnings through the ledger ----------
    if (action === "set_status") {
      const ids: string[] = Array.isArray(body?.earning_ids) ? body.earning_ids.filter(uuidOk) : [];
      const status = String(body?.status ?? "");
      if (!ids.length) return json({ error: "Select at least one earning." }, 400);
      if (!["approved", "payable", "disputed", "pending"].includes(status)) {
        return json({ error: "That status cannot be set here." }, 400);
      }

      const patch: Record<string, unknown> = { status };
      if (status === "approved") {
        patch.approved_by = user.id;
        patch.approved_at = new Date().toISOString();
      }

      const { error } = await admin.from("rider_earnings").update(patch).in("id", ids);
      if (error) return json({ error: error.message }, 400);
      await audit("earning_status", null, { ids, status });
      return json({ ok: true, updated: ids.length });
    }

    // ---------- adjust an earning (reason mandatory) ----------
    if (action === "adjust") {
      const earningId = String(body?.earning_id ?? "");
      const delta = Number(body?.delta_ghs);
      const reason = String(body?.reason ?? "").trim();
      if (!uuidOk(earningId)) return json({ error: "Invalid earning." }, 400);
      if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 5000) {
        return json({ error: "Enter an adjustment between -5000 and 5000." }, 400);
      }
      if (reason.length < 3) return json({ error: "A reason is required." }, 400);

      const { data: earning } = await admin
        .from("rider_earnings")
        .select("id, status, earning_ghs")
        .eq("id", earningId)
        .maybeSingle();
      if (!earning) return json({ error: "Earning not found." }, 404);
      if (earning.status === "paid") {
        return json({ error: "This earning has already been paid out." }, 400);
      }

      const { error } = await admin.from("rider_earning_adjustments").insert({
        earning_id: earningId,
        delta_ghs: round2(delta),
        reason: reason.slice(0, 500),
        created_by: user.id,
      });
      if (error) return json({ error: error.message }, 400);
      await audit("earning_adjusted", earningId, { delta_ghs: round2(delta), reason });
      return json({ ok: true });
    }

    // ---------- record a payout ----------
    if (action === "record_payout") {
      const riderId = String(body?.rider_id ?? "");
      const ids: string[] = Array.isArray(body?.earning_ids) ? body.earning_ids.filter(uuidOk) : [];
      const method = String(body?.method ?? "");
      if (!uuidOk(riderId)) return json({ error: "Select a rider." }, 400);
      if (!ids.length) return json({ error: "Select the earnings this payout covers." }, 400);
      if (!["cash", "mobile_money", "bank_transfer"].includes(method)) {
        return json({ error: "Choose a payment method." }, 400);
      }

      // Only unpaid earnings belonging to this rider may be settled.
      const { data: earnings } = await admin
        .from("rider_earnings")
        .select("id, rider_id, earning_ghs, status, created_at")
        .in("id", ids);
      const eligible = (earnings ?? []).filter(
        (e: any) => e.rider_id === riderId && ["approved", "payable", "adjusted"].includes(e.status),
      );
      if (!eligible.length) {
        return json({ error: "None of those earnings are approved and unpaid for this rider." }, 400);
      }

      const amount = round2(eligible.reduce((s: number, e: any) => s + Number(e.earning_ghs), 0));
      const dates = eligible.map((e: any) => String(e.created_at).slice(0, 10)).sort();

      const { data: payout, error: pErr } = await admin
        .from("rider_payouts")
        .insert({
          rider_id: riderId,
          amount_ghs: amount,
          delivery_count: eligible.length,
          period_start: dates[0],
          period_end: dates[dates.length - 1],
          method,
          reference: String(body?.reference ?? "").slice(0, 120) || null,
          notes: String(body?.notes ?? "").slice(0, 500) || null,
          processed_by: user.id,
        })
        .select("id")
        .single();
      if (pErr) return json({ error: pErr.message }, 400);

      const { error: iErr } = await admin.from("rider_payout_items").insert(
        eligible.map((e: any) => ({
          payout_id: payout.id,
          earning_id: e.id,
          amount_ghs: Number(e.earning_ghs),
        })),
      );
      if (iErr) {
        // Roll back the header so we never leave an orphan payout.
        await admin.from("rider_payouts").delete().eq("id", payout.id);
        return json({ error: "Some of those earnings are already in a payout." }, 400);
      }

      const nowIso = new Date().toISOString();
      // 'paid' is only legal from 'payable', so step through it.
      await admin.from("rider_earnings").update({ status: "payable" }).in(
        "id",
        eligible.map((e: any) => e.id),
      );
      const { error: uErr } = await admin
        .from("rider_earnings")
        .update({ status: "paid", paid_at: nowIso, payout_id: payout.id })
        .in("id", eligible.map((e: any) => e.id));
      if (uErr) return json({ error: uErr.message }, 400);

      await audit("payout_recorded", payout.id, {
        rider_id: riderId,
        amount_ghs: amount,
        method,
        earnings: eligible.length,
      });
      return json({ ok: true, payout_id: payout.id, amount_ghs: amount, count: eligible.length });
    }

    // ---------- confirm cash handed back to the hotel ----------
    if (action === "confirm_remittance") {
      const id = String(body?.remittance_id ?? "");
      const amount = Number(body?.amount_remitted_ghs);
      if (!uuidOk(id)) return json({ error: "Invalid record." }, 400);
      if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
        return json({ error: "Enter a valid amount." }, 400);
      }

      const { data: row } = await admin
        .from("cod_remittances")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!row) return json({ error: "Record not found." }, 404);

      const remitted = round2(Number(row.amount_remitted_ghs) + amount);
      const outstanding = round2(Number(row.cash_collected_ghs) - remitted);

      const { error } = await admin
        .from("cod_remittances")
        .update({
          amount_remitted_ghs: remitted,
          outstanding_ghs: outstanding,
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
          note: String(body?.note ?? "").slice(0, 500) || row.note,
        })
        .eq("id", id);
      if (error) return json({ error: error.message }, 400);

      // Customer order counts as settled once the hotel holds the cash.
      if (outstanding <= 0 && row.food_order_id) {
        await admin
          .from("food_orders")
          .update({ payment_status: "paid", paid_at: new Date().toISOString() })
          .eq("id", row.food_order_id);
      }

      await audit("cod_remitted", id, { amount, remitted, outstanding });
      return json({ ok: true, remitted, outstanding });
    }

    // ---------- rider statement ----------
    if (action === "statement") {
      const riderId = String(body?.rider_id ?? "");
      if (!uuidOk(riderId)) return json({ error: "Select a rider." }, 400);
      const from = typeof body?.from === "string" ? body.from : null;
      const to = typeof body?.to === "string" ? body.to : null;

      let q = admin
        .from("rider_earnings")
        .select("id, earning_ghs, base_earning_ghs, adjustment_total_ghs, status, created_at")
        .eq("rider_id", riderId);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lte("created_at", `${to}T23:59:59Z`);
      const { data: earnings } = await q;

      let pq = admin.from("rider_payouts").select("amount_ghs, processed_at").eq("rider_id", riderId);
      if (from) pq = pq.gte("processed_at", from);
      if (to) pq = pq.lte("processed_at", `${to}T23:59:59Z`);
      const { data: payouts } = await pq;

      const rows = earnings ?? [];
      const gross = round2(rows.reduce((s, e: any) => s + Number(e.base_earning_ghs), 0));
      const adjustments = round2(rows.reduce((s, e: any) => s + Number(e.adjustment_total_ghs), 0));
      const paidOut = round2((payouts ?? []).reduce((s, p: any) => s + Number(p.amount_ghs), 0));
      const unpaid = round2(
        rows
          .filter((e: any) => e.status !== "paid")
          .reduce((s, e: any) => s + Number(e.earning_ghs), 0),
      );

      // Opening balance = everything outstanding before the window started.
      let ob = 0;
      if (from) {
        const { data: prior } = await admin
          .from("rider_earnings")
          .select("earning_ghs, status")
          .eq("rider_id", riderId)
          .lt("created_at", from);
        ob = round2(
          (prior ?? [])
            .filter((e: any) => e.status !== "paid")
            .reduce((s, e: any) => s + Number(e.earning_ghs), 0),
        );
      }

      return json({
        ok: true,
        statement: {
          opening_balance_ghs: ob,
          completed_deliveries: rows.length,
          gross_earnings_ghs: gross,
          adjustments_ghs: adjustments,
          previous_payouts_ghs: paidOut,
          current_payable_ghs: round2(ob + unpaid),
        },
      });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    console.error("rider-payouts failed", err);
    return json({ error: "That action could not be completed." }, 500);
  }
});
