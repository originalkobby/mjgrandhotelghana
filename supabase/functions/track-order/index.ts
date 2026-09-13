import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientKey, corsHeaders, json, loadSettings, rateLimit } from "../_shared/delivery.ts";

/**
 * Public order tracking. Access is only ever granted through the delivery's
 * unguessable tracking token — no browsing of other customers' orders is possible.
 * Only non-sensitive fields are returned.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!rateLimit(`track:${clientKey(req)}`, 90, 60_000)) {
      return json({ error: "Too many requests. Please slow down." }, 429);
    }

    const url = new URL(req.url);
    let token = url.searchParams.get("token") ?? "";
    if (!token && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      token = String(body?.token ?? "");
    }
    if (!/^[a-f0-9]{16,80}$/i.test(token)) {
      return json({ error: "Invalid tracking link." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const settings = await loadSettings(supabase);
    if (!settings.customer_tracking_enabled) {
      return json({ error: "Order tracking is temporarily unavailable." }, 503);
    }

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select(
        "id, status, dest_address, dest_landmark, dest_lat, dest_lng, origin_lat, origin_lng, distance_km, eta_min_minutes, eta_max_minutes, fee_ghs, assigned_at, accepted_at, picked_up_at, on_the_way_at, delivered_at, cancelled_at, created_at, rider_id, food_order_id",
      )
      .eq("tracking_token", token)
      .maybeSingle();

    if (error || !delivery) return json({ error: "We could not find that order." }, 404);

    const [{ data: order }, { data: history }] = await Promise.all([
      supabase
        .from("food_orders")
        .select(
          "reference_code, guest_name, order_type, status, subtotal_ghs, delivery_fee_ghs, total_ghs, payment_method, payment_status, created_at, food_order_items(name, quantity, price_ghs, line_total_ghs)",
        )
        .eq("id", delivery.food_order_id)
        .maybeSingle(),
      supabase
        .from("delivery_status_history")
        .select("new_status, created_at")
        .eq("delivery_id", delivery.id)
        .order("created_at", { ascending: true }),
    ]);

    let rider: any = null;
    let riderLocation: any = null;
    const liveStatuses = ["rider_accepted", "rider_picked_up", "on_the_way"];
    if (delivery.rider_id) {
      const { data: r } = await supabase
        .from("delivery_riders")
        .select("full_name, phone, vehicle_type")
        .eq("id", delivery.rider_id)
        .maybeSingle();
      if (r) {
        rider = {
          first_name: String(r.full_name).split(" ")[0],
          phone: r.phone,
          vehicle_type: r.vehicle_type,
        };
      }
      if (liveStatuses.includes(delivery.status)) {
        const { data: loc } = await supabase
          .from("rider_locations")
          .select("lat, lng, recorded_at")
          .eq("delivery_id", delivery.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        riderLocation = loc ?? null;
      }
    }

    return json({
      status: delivery.status,
      order: order
        ? {
            reference_code: order.reference_code,
            guest_first_name: String(order.guest_name).split(" ")[0],
            order_type: order.order_type,
            subtotal_ghs: order.subtotal_ghs,
            delivery_fee_ghs: order.delivery_fee_ghs,
            total_ghs: order.total_ghs,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            placed_at: order.created_at,
            items: order.food_order_items ?? [],
          }
        : null,
      delivery: {
        dest_address: delivery.dest_address,
        dest_landmark: delivery.dest_landmark,
        dest_lat: delivery.dest_lat,
        dest_lng: delivery.dest_lng,
        origin_lat: delivery.origin_lat,
        origin_lng: delivery.origin_lng,
        distance_km: delivery.distance_km,
        eta_min_minutes: delivery.eta_min_minutes,
        eta_max_minutes: delivery.eta_max_minutes,
        fee_ghs: delivery.fee_ghs,
        created_at: delivery.created_at,
        delivered_at: delivery.delivered_at,
        cancelled_at: delivery.cancelled_at,
      },
      rider,
      rider_location: riderLocation,
      history: history ?? [],
      poll_seconds: Math.max(10, settings.rider_ping_seconds),
    });
  } catch (err) {
    console.error("track-order failed", err);
    return json({ error: "Tracking is unavailable right now." }, 500);
  }
});
