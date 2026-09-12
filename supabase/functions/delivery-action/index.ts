import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { canTransition, corsHeaders, json, loadSettings } from "../_shared/delivery.ts";
import { accrueEarning } from "../_shared/riderPay.ts";

/**
 * Single authenticated entry point for every delivery state change.
 * Enforces role permissions, legal transitions, audit logging and guest emails
 * so no client can push a delivery into an invalid or unauthorised state.
 */

const OPS_ROLES = ["admin", "operations_manager"];
const STAFF_ROLES = ["admin", "operations_manager", "restaurant_staff"];

const EMAIL_STAGES = new Set([
  "confirmed",
  "ready_for_pickup",
  "on_the_way",
  "delivered",
  "cancelled",
  "review_rejected",
]);

// Which statuses each actor group may set.
const STAFF_STATUSES = new Set([
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "cancelled",
  "review_rejected",
]);
const RIDER_STATUSES = new Set([
  "rider_accepted",
  "rider_picked_up",
  "on_the_way",
  "delivered",
  "failed",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in required." }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    const user = userData?.user;
    if (userError || !user) return json({ error: "Your session has expired." }, 401);

    const [{ data: roleRows }, { data: riderRow }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id),
      admin.from("delivery_riders").select("id, is_active").eq("user_id", user.id).maybeSingle(),
    ]);
    const roles: string[] = (roleRows ?? []).map((r: any) => r.role);
    const isOps = roles.some((r) => OPS_ROLES.includes(r));
    const isStaff = roles.some((r) => STAFF_ROLES.includes(r));
    const riderId = riderRow?.is_active ? riderRow.id : null;
    if (!isStaff && !riderId) return json({ error: "You do not have delivery access." }, 403);
    const actorRole = isOps ? (roles.includes("admin") ? "admin" : "operations_manager")
      : isStaff ? "restaurant_staff" : "rider";

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const deliveryId = String(body?.delivery_id ?? "");
    if (!deliveryId) return json({ error: "delivery_id is required." }, 400);

    const { data: delivery } = await admin
      .from("deliveries")
      .select("*")
      .eq("id", deliveryId)
      .maybeSingle();
    if (!delivery) return json({ error: "Delivery not found." }, 404);

    const isAssignedRider = riderId && delivery.rider_id === riderId;
    if (!isStaff && !isAssignedRider) {
      return json({ error: "This delivery is not assigned to you." }, 403);
    }

    const audit = async (act: string, details: Record<string, unknown>) => {
      await admin.from("delivery_audit_log").insert({
        actor_id: user.id,
        actor_role: actorRole,
        action: act,
        entity_type: "delivery",
        entity_id: deliveryId,
        details,
      });
    };

    // Hands the delivery to the automatic dispatch engine. Best effort: a
    // dispatch failure must never block the kitchen's status change.
    const autoDispatch = async () => {
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/dispatch-rider`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ action: "dispatch", delivery_id: deliveryId }),
        });
      } catch (e) {
        console.error("auto dispatch failed", e);
      }
    };

    const notify = async (stage: string) => {
      if (!EMAIL_STAGES.has(stage)) return;
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-delivery-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ deliveryId, stage }),
        });
      } catch (e) {
        console.error("notify failed", e);
      }
    };

    // ---------- assign rider ----------
    if (action === "assign_rider") {
      if (!isStaff) return json({ error: "Only restaurant staff can assign riders." }, 403);
      const newRiderId = String(body?.rider_id ?? "");
      const { data: rider } = await admin
        .from("delivery_riders")
        .select("id, is_active, status, full_name")
        .eq("id", newRiderId)
        .maybeSingle();
      if (!rider || !rider.is_active) return json({ error: "That rider is not available." }, 400);
      if (["delivered", "cancelled"].includes(delivery.status)) {
        return json({ error: "This delivery is already closed." }, 400);
      }

      const nextStatus = canTransition(delivery.status, "rider_assigned")
        ? "rider_assigned"
        : delivery.status;

      const { error } = await admin
        .from("deliveries")
        .update({
          rider_id: rider.id,
          assigned_at: new Date().toISOString(),
          status: nextStatus,
          dispatch_state: "assigned",
        })
        .eq("id", deliveryId);
      if (error) throw error;

      // A manual assignment always wins: close any open automatic offer.
      await admin
        .from("delivery_offers")
        .update({ status: "superseded", responded_at: new Date().toISOString() })
        .eq("delivery_id", deliveryId)
        .eq("status", "offered");

      await admin.from("delivery_riders").update({ status: "busy" }).eq("id", rider.id);
      await admin.from("delivery_status_history").insert({
        delivery_id: deliveryId,
        previous_status: delivery.status,
        new_status: nextStatus,
        changed_by: user.id,
        actor_role: actorRole,
        note: `Assigned to ${rider.full_name}`,
      });
      await audit("assign_rider", { rider_id: rider.id });
      return json({ ok: true, status: nextStatus });
    }

    // ---------- review a long-distance delivery ----------
    if (action === "review") {
      if (!isStaff) return json({ error: "Only restaurant staff can review deliveries." }, 403);
      const decision = body?.decision === "approved" ? "approved" : "rejected";
      const note = String(body?.note ?? "").slice(0, 500) || null;
      const nextStatus = decision === "approved" ? "confirmed" : "review_rejected";

      const patch: Record<string, unknown> = {
        review_decision: decision,
        review_note: note,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        requires_review: false,
        status: nextStatus,
      };
      if (decision === "approved" && Number.isFinite(Number(body?.fee_ghs))) {
        patch.fee_ghs = Math.round(Number(body.fee_ghs) * 100) / 100;
        patch.fee_overridden_by = user.id;
      }

      const { error } = await admin.from("deliveries").update(patch).eq("id", deliveryId);
      if (error) throw error;

      if (patch.fee_ghs !== undefined) {
        const { data: order } = await admin
          .from("food_orders")
          .select("subtotal_ghs")
          .eq("id", delivery.food_order_id)
          .maybeSingle();
        const total = Math.round(((Number(order?.subtotal_ghs) || 0) + Number(patch.fee_ghs)) * 100) / 100;
        await admin
          .from("food_orders")
          .update({ delivery_fee_ghs: patch.fee_ghs, total_ghs: total })
          .eq("id", delivery.food_order_id);
      }

      await admin.from("delivery_status_history").insert({
        delivery_id: deliveryId,
        previous_status: delivery.status,
        new_status: nextStatus,
        changed_by: user.id,
        actor_role: actorRole,
        note,
      });
      await audit("review", { decision, note, fee_ghs: patch.fee_ghs ?? null });
      await notify(nextStatus);
      return json({ ok: true, status: nextStatus });
    }

    // ---------- override the delivery fee ----------
    if (action === "override_fee") {
      if (!isOps) return json({ error: "Only managers can change a delivery fee." }, 403);
      const fee = Number(body?.fee_ghs);
      if (!Number.isFinite(fee) || fee < 0 || fee > 1000) {
        return json({ error: "Enter a fee between 0 and 1000." }, 400);
      }
      const rounded = Math.round(fee * 100) / 100;
      const { data: order } = await admin
        .from("food_orders")
        .select("subtotal_ghs")
        .eq("id", delivery.food_order_id)
        .maybeSingle();
      const total = Math.round(((Number(order?.subtotal_ghs) || 0) + rounded) * 100) / 100;

      await admin
        .from("deliveries")
        .update({ fee_ghs: rounded, fee_overridden_by: user.id })
        .eq("id", deliveryId);
      await admin
        .from("food_orders")
        .update({ delivery_fee_ghs: rounded, total_ghs: total })
        .eq("id", delivery.food_order_id);
      await audit("override_fee", { from: delivery.fee_ghs, to: rounded });
      return json({ ok: true, fee_ghs: rounded, total_ghs: total });
    }

    // ---------- status change ----------
    if (action === "update_status") {
      const next = String(body?.status ?? "");
      if (!canTransition(delivery.status, next)) {
        return json({ error: `Cannot move a delivery from ${delivery.status} to ${next}.` }, 400);
      }
      const allowed = isStaff ? STAFF_STATUSES : RIDER_STATUSES;
      if (!allowed.has(next) && !(isStaff && RIDER_STATUSES.has(next) && isOps)) {
        return json({ error: "You are not allowed to set that status." }, 403);
      }
      if ((next === "rider_accepted" || next === "rider_picked_up") && !delivery.rider_id) {
        return json({ error: "Assign a rider first." }, 400);
      }

      const now = new Date().toISOString();
      const stamps: Record<string, string> = {
        rider_accepted: "accepted_at",
        rider_picked_up: "picked_up_at",
        on_the_way: "on_the_way_at",
        delivered: "delivered_at",
        cancelled: "cancelled_at",
      };
      const patch: Record<string, unknown> = { status: next };
      if (stamps[next]) patch[stamps[next]] = now;
      if (next === "cancelled") {
        patch.cancelled_by = user.id;
        patch.cancel_reason = String(body?.reason ?? "").slice(0, 500) || null;
      }

      const { error } = await admin.from("deliveries").update(patch).eq("id", deliveryId);
      if (error) throw error;

      // Keep the food order in step and free the rider when the run ends.
      const orderStatusMap: Record<string, string> = {
        confirmed: "confirmed",
        ready_for_pickup: "ready",
        on_the_way: "out_for_delivery",
        delivered: "completed",
        cancelled: "cancelled",
      };
      if (orderStatusMap[next]) {
        await admin
          .from("food_orders")
          .update({ status: orderStatusMap[next] })
          .eq("id", delivery.food_order_id);
      }
      if (["delivered", "cancelled", "failed"].includes(next) && delivery.rider_id) {
        await admin.from("delivery_riders").update({ status: "available" }).eq("id", delivery.rider_id);
      }
      if (next === "delivered") {
        const { data: order } = await admin
          .from("food_orders")
          .select("payment_method, payment_status, total_ghs")
          .eq("id", delivery.food_order_id)
          .maybeSingle();

        // Cash on delivery: the rider holds the hotel's money until staff
        // confirm the remittance. The order is NOT auto-marked paid.
        if (order?.payment_method === "cash_on_delivery") {
          const due = Number(order.total_ghs) || 0;
          const collectedRaw = Number(body?.cash_collected_ghs);
          const collected = Number.isFinite(collectedRaw) && collectedRaw >= 0
            ? Math.min(Math.round(collectedRaw * 100) / 100, due * 2)
            : 0;
          const { error: codErr } = await admin.from("cod_remittances").insert({
            delivery_id: deliveryId,
            food_order_id: delivery.food_order_id,
            rider_id: delivery.rider_id,
            amount_due_ghs: due,
            cash_collected_ghs: collected,
            amount_remitted_ghs: 0,
            outstanding_ghs: Math.round(collected * 100) / 100,
            collected_at: now,
          });
          if (codErr && !String(codErr.code).includes("23505")) {
            console.error("cod remittance insert failed", codErr);
          }
          await audit("cod_collected", { amount_due_ghs: due, cash_collected_ghs: collected });
        }

        // Rider compensation — separate from anything the customer paid.
        const accrual = await accrueEarning(admin, {
          id: deliveryId,
          rider_id: delivery.rider_id,
          food_order_id: delivery.food_order_id,
          distance_km: delivery.distance_km,
          fee_ghs: delivery.fee_ghs,
        });
        if (accrual.created) {
          await audit("rider_earning_accrued", { earning_ghs: accrual.earning_ghs });
        }
      }

      await admin.from("delivery_status_history").insert({
        delivery_id: deliveryId,
        previous_status: delivery.status,
        new_status: next,
        changed_by: user.id,
        actor_role: actorRole,
        note: String(body?.note ?? "").slice(0, 500) || null,
      });
      await audit("update_status", { from: delivery.status, to: next });
      await notify(next);

      const settings = await loadSettings(admin);
      return json({ ok: true, status: next, poll_seconds: settings.rider_ping_seconds });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    console.error("delivery-action failed", err);
    return json({ error: "That action could not be completed." }, 500);
  }
});
