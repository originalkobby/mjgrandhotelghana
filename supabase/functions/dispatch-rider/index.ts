import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientKey, corsHeaders, json, loadSettings, rateLimit } from "../_shared/delivery.ts";
import { computeRiderEarning, loadCompRule } from "../_shared/riderPay.ts";
import { ACTIVE_JOB_STATUSES, type Candidate, rankRiders } from "../_shared/dispatch.ts";

/**
 * Automatic rider dispatch engine.
 *
 * Actions:
 *  - dispatch : offer a delivery to the best available rider (internal or ops)
 *  - respond  : the offered rider accepts or declines
 *  - sweep    : expire stale offers and re-offer (cron / board refresh)
 *
 * Every write goes through the service role here, so a rider can never assign
 * themselves a job they were not offered, and one delivery can never end up
 * with two accepted offers (enforced by a partial unique index too).
 */

const uuidOk = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function audit(
  db: any,
  actorId: string | null,
  actorRole: string,
  action: string,
  entityId: string | null,
  details: Record<string, unknown>,
) {
  await db.from("delivery_audit_log").insert({
    actor_id: actorId,
    actor_role: actorRole,
    action,
    entity_type: "delivery_dispatch",
    entity_id: entityId,
    details,
  });
}

/**
 * Creates the next offer for a delivery. Idempotent: if an open offer already
 * exists it is returned untouched instead of creating a second one.
 */
async function offerNext(
  db: any,
  deliveryId: string,
  actorId: string | null,
  actorRole: string,
): Promise<{ ok: boolean; state: string; rider_id?: string; reason?: string }> {
  const { data: delivery } = await db
    .from("deliveries")
    .select("id, status, rider_id, distance_km, fee_ghs, dispatch_attempts, origin_lat, origin_lng")
    .eq("id", deliveryId)
    .maybeSingle();
  if (!delivery) return { ok: false, state: "idle", reason: "not_found" };

  if (delivery.rider_id) return { ok: true, state: "assigned" };
  if (delivery.status !== "ready_for_pickup") {
    return { ok: false, state: "idle", reason: "not_ready" };
  }

  const nowIso = new Date().toISOString();

  // An offer already out and still valid — nothing to do.
  const { data: openOffer } = await db
    .from("delivery_offers")
    .select("id, rider_id, expires_at")
    .eq("delivery_id", deliveryId)
    .eq("status", "offered")
    .gt("expires_at", nowIso)
    .maybeSingle();
  if (openOffer) return { ok: true, state: "offering", rider_id: openOffer.rider_id };

  const settings = await loadSettings(db);
  const timeout = Math.max(15, Math.min(600, Number((settings as any).offer_timeout_seconds) || 60));
  const maxAttempts = Math.max(1, Math.min(20, Number((settings as any).max_dispatch_attempts) || 3));

  // Expire anything that ran out.
  await db
    .from("delivery_offers")
    .update({ status: "expired", responded_at: nowIso })
    .eq("delivery_id", deliveryId)
    .eq("status", "offered")
    .lte("expires_at", nowIso);

  const { data: priorOffers } = await db
    .from("delivery_offers")
    .select("rider_id, attempt")
    .eq("delivery_id", deliveryId);
  const tried = (priorOffers ?? []).map((o: any) => o.rider_id);
  const attempt = (priorOffers ?? []).length + 1;

  const flagNeedsRider = async (reason: string) => {
    await db
      .from("deliveries")
      .update({ dispatch_state: "needs_rider", dispatch_attempts: tried.length })
      .eq("id", deliveryId);
    await audit(db, actorId, actorRole, "dispatch_needs_rider", deliveryId, { reason, tried });
    return { ok: false, state: "needs_rider", reason };
  };

  if (attempt > maxAttempts) return await flagNeedsRider("max_attempts");

  const { data: riders } = await db
    .from("delivery_riders")
    .select("id, is_active, status, last_lat, last_lng");

  // Count each rider's open jobs so we never double-book.
  const { data: busyRows } = await db
    .from("deliveries")
    .select("rider_id")
    .in("status", ACTIVE_JOB_STATUSES)
    .not("rider_id", "is", null);
  const load = new Map<string, number>();
  for (const r of busyRows ?? []) {
    load.set(r.rider_id, (load.get(r.rider_id) ?? 0) + 1);
  }

  const candidates: Candidate[] = (riders ?? []).map((r: any) => ({
    id: r.id,
    is_active: !!r.is_active,
    status: String(r.status),
    last_lat: r.last_lat === null ? null : Number(r.last_lat),
    last_lng: r.last_lng === null ? null : Number(r.last_lng),
    open_jobs: load.get(r.id) ?? 0,
  }));

  const ranked = rankRiders(
    candidates,
    { lat: Number(delivery.origin_lat), lng: Number(delivery.origin_lng) },
    tried,
  );
  if (!ranked.length) return await flagNeedsRider("no_available_rider");

  const pick = ranked[0];
  const rule = await loadCompRule(db);
  const { earning_ghs } = computeRiderEarning(
    rule,
    Number(delivery.distance_km),
    Number(delivery.fee_ghs),
  );

  const { error } = await db.from("delivery_offers").insert({
    delivery_id: deliveryId,
    rider_id: pick.id,
    attempt,
    status: "offered",
    distance_km: Number(delivery.distance_km) || 0,
    estimated_earning_ghs: earning_ghs,
    offered_at: nowIso,
    expires_at: new Date(Date.now() + timeout * 1000).toISOString(),
  });
  if (error) {
    // A concurrent isolate won the race — that's fine, an offer exists.
    if (String(error.code) === "23505") return { ok: true, state: "offering" };
    console.error("offer insert failed", error);
    return { ok: false, state: "idle", reason: "insert_failed" };
  }

  await db
    .from("deliveries")
    .update({ dispatch_state: "offering", dispatch_attempts: attempt })
    .eq("id", deliveryId);
  await audit(db, actorId, actorRole, "dispatch_offered", deliveryId, {
    rider_id: pick.id,
    attempt,
    distance_km: pick.distance_km,
    estimated_earning_ghs: earning_ghs,
    expires_in_seconds: timeout,
  });

  return { ok: true, state: "offering", rider_id: pick.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!rateLimit(`dispatch:${clientKey(req)}`, 120, 60_000)) {
      return json({ error: "Too many requests. Please slow down." }, 429);
    }

    const db = admin();
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const isInternal = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let userId: string | null = null;
    let roles: string[] = [];
    let riderId: string | null = null;

    if (!isInternal) {
      if (!token) return json({ error: "Sign in required." }, 401);
      const { data: userData } = await db.auth.getUser(token);
      const user = userData?.user;
      if (!user) return json({ error: "Your session has expired." }, 401);
      userId = user.id;
      const [{ data: roleRows }, { data: riderRow }] = await Promise.all([
        db.from("user_roles").select("role").eq("user_id", user.id),
        db.from("delivery_riders").select("id, is_active").eq("user_id", user.id).maybeSingle(),
      ]);
      roles = (roleRows ?? []).map((r: any) => r.role);
      riderId = riderRow?.is_active ? riderRow.id : null;
    }

    const isOps = isInternal || roles.includes("admin") || roles.includes("operations_manager");
    const isStaff = isOps || roles.includes("restaurant_staff");
    const actorRole = isInternal
      ? "system"
      : roles.includes("admin")
      ? "admin"
      : roles.includes("operations_manager")
      ? "operations_manager"
      : roles.includes("restaurant_staff")
      ? "restaurant_staff"
      : "rider";

    // ---------- offer a delivery ----------
    if (action === "dispatch") {
      if (!isStaff) return json({ error: "Only restaurant staff can dispatch riders." }, 403);
      const deliveryId = String(body?.delivery_id ?? "");
      if (!uuidOk(deliveryId)) return json({ error: "Invalid delivery." }, 400);
      const result = await offerNext(db, deliveryId, userId, actorRole);
      return json(result, result.ok ? 200 : 200);
    }

    // ---------- rider accepts or declines ----------
    if (action === "respond") {
      if (!riderId) return json({ error: "Only riders can respond to an offer." }, 403);
      const offerId = String(body?.offer_id ?? "");
      const decision = String(body?.decision ?? "");
      if (!uuidOk(offerId)) return json({ error: "Invalid offer." }, 400);
      if (!["accept", "decline"].includes(decision)) {
        return json({ error: "Choose accept or decline." }, 400);
      }

      const { data: offer } = await db
        .from("delivery_offers")
        .select("*")
        .eq("id", offerId)
        .maybeSingle();
      if (!offer) return json({ error: "That offer no longer exists." }, 404);
      if (offer.rider_id !== riderId) return json({ error: "This offer is not yours." }, 403);
      if (offer.status !== "offered") return json({ error: "This offer has already closed." }, 400);
      if (new Date(offer.expires_at).getTime() < Date.now()) {
        await db
          .from("delivery_offers")
          .update({ status: "expired", responded_at: new Date().toISOString() })
          .eq("id", offerId);
        await offerNext(db, offer.delivery_id, userId, "system");
        return json({ error: "That offer has expired." }, 400);
      }

      const nowIso = new Date().toISOString();

      if (decision === "decline") {
        await db
          .from("delivery_offers")
          .update({
            status: "declined",
            responded_at: nowIso,
            decline_reason: String(body?.reason ?? "").slice(0, 300) || null,
          })
          .eq("id", offerId)
          .eq("status", "offered");
        await audit(db, userId, "rider", "dispatch_declined", offer.delivery_id, {
          rider_id: riderId,
          attempt: offer.attempt,
        });
        const next = await offerNext(db, offer.delivery_id, userId, "system");
        return json({ ok: true, declined: true, next_state: next.state });
      }

      // Accept — only if the delivery is still unassigned.
      const { data: claimed, error: claimErr } = await db
        .from("deliveries")
        .update({
          rider_id: riderId,
          assigned_at: nowIso,
          status: "rider_assigned",
          dispatch_state: "assigned",
        })
        .eq("id", offer.delivery_id)
        .is("rider_id", null)
        .eq("status", "ready_for_pickup")
        .select("id, status")
        .maybeSingle();
      if (claimErr) throw claimErr;
      if (!claimed) {
        await db
          .from("delivery_offers")
          .update({ status: "superseded", responded_at: nowIso })
          .eq("id", offerId);
        return json({ error: "Another rider already took this delivery." }, 409);
      }

      const { error: acceptErr } = await db
        .from("delivery_offers")
        .update({ status: "accepted", responded_at: nowIso })
        .eq("id", offerId)
        .eq("status", "offered");
      if (acceptErr) {
        // Could not mark the offer — roll the delivery back so nothing is stuck.
        await db
          .from("deliveries")
          .update({ rider_id: null, assigned_at: null, status: "ready_for_pickup", dispatch_state: "offering" })
          .eq("id", offer.delivery_id);
        return json({ error: "That offer could not be accepted." }, 409);
      }

      await db
        .from("delivery_offers")
        .update({ status: "superseded", responded_at: nowIso })
        .eq("delivery_id", offer.delivery_id)
        .eq("status", "offered");
      await db.from("delivery_riders").update({ status: "busy" }).eq("id", riderId);
      await db.from("delivery_status_history").insert({
        delivery_id: offer.delivery_id,
        previous_status: "ready_for_pickup",
        new_status: "rider_assigned",
        changed_by: userId,
        actor_role: "rider",
        note: "Accepted from automatic dispatch",
      });
      await audit(db, userId, "rider", "dispatch_accepted", offer.delivery_id, {
        rider_id: riderId,
        attempt: offer.attempt,
      });

      return json({ ok: true, accepted: true, delivery_id: offer.delivery_id });
    }

    // ---------- expire stale offers and re-dispatch ----------
    if (action === "sweep") {
      if (!isStaff && !riderId) return json({ error: "Not allowed." }, 403);
      const nowIso = new Date().toISOString();
      const { data: stale } = await db
        .from("delivery_offers")
        .select("id, delivery_id")
        .eq("status", "offered")
        .lte("expires_at", nowIso)
        .limit(50);

      const deliveries = new Set<string>();
      for (const o of stale ?? []) deliveries.add(o.delivery_id);
      if (stale?.length) {
        await db
          .from("delivery_offers")
          .update({ status: "expired", responded_at: nowIso })
          .in("id", stale.map((o: any) => o.id));
      }

      // Also pick up anything ready but never offered (e.g. missed trigger).
      const { data: idle } = await db
        .from("deliveries")
        .select("id")
        .eq("status", "ready_for_pickup")
        .is("rider_id", null)
        .in("dispatch_state", ["idle", "offering"])
        .limit(50);
      for (const d of idle ?? []) deliveries.add(d.id);

      let redispatched = 0;
      for (const id of deliveries) {
        const r = await offerNext(db, id, null, "system");
        if (r.state === "offering") redispatched++;
      }
      return json({ ok: true, expired: stale?.length ?? 0, redispatched });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    console.error("dispatch-rider failed", err);
    return json({ error: "That action could not be completed." }, 500);
  }
});
