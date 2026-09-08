import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  clientKey,
  computeFee,
  computeRoute,
  corsHeaders,
  etaRange,
  json,
  loadSettings,
  rateLimit,
} from "../_shared/delivery.ts";

type IncomingItem = {
  menu_item_id?: string | null;
  name?: string;
  price_ghs?: number | string;
  quantity?: number;
};

function parsePrice(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function newRef() {
  return "FO-MJ-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

const ORDER_TYPES = ["dine_in", "room_service", "takeaway", "delivery"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!rateLimit(`order:${clientKey(req)}`, 6, 10 * 60_000)) {
      return json({ error: "Too many orders from this device. Please try again shortly." }, 429);
    }

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const guestName = String(body.guest_name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const roomNumber = String(body.room_number ?? "").trim();
    const notes = String(body.notes ?? "").trim().slice(0, 1000);
    const orderType = String(body.order_type ?? "");
    const paymentMethod = body.payment_method === "paystack" ? "paystack" : "cash_on_delivery";
    const items: IncomingItem[] = Array.isArray(body.items) ? body.items.slice(0, 30) : [];

    if (!guestName || guestName.length > 120) return json({ error: "Please enter your name." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "A valid email is required." }, 400);
    if (!ORDER_TYPES.includes(orderType)) return json({ error: "Invalid order type." }, 400);
    if (items.length === 0) return json({ error: "Your order is empty." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Server-side item pricing (never trust client prices) ----
    const { data: menuRows } = await supabase
      .from("menu_items")
      .select("id, name, price, is_active")
      .eq("is_active", true);
    const byId = new Map<string, any>((menuRows ?? []).map((m: any) => [m.id, m]));
    const byName = new Map<string, any>(
      (menuRows ?? []).map((m: any) => [String(m.name).trim().toLowerCase(), m]),
    );

    const priced = items.map((item) => {
      const qty = Math.min(50, Math.max(1, Math.floor(Number(item.quantity) || 1)));
      const match =
        (item.menu_item_id && byId.get(item.menu_item_id)) ||
        byName.get(String(item.name ?? "").trim().toLowerCase());
      const name = match ? match.name : String(item.name ?? "").trim().slice(0, 160);
      const unit = match ? parsePrice(match.price) : parsePrice(item.price_ghs);
      return {
        menu_item_id: match ? match.id : null,
        name,
        price_ghs: unit,
        quantity: qty,
        line_total_ghs: Math.round(unit * qty * 100) / 100,
      };
    });

    if (priced.some((p) => !p.name || p.price_ghs <= 0)) {
      return json({ error: "One or more dishes could not be priced. Please reselect them." }, 400);
    }

    const subtotal = Math.round(priced.reduce((s, p) => s + p.line_total_ghs, 0) * 100) / 100;

    // ---- Delivery pricing ----
    const isDelivery = orderType === "delivery";
    let deliveryFee = 0;
    let deliveryPayload: any = null;
    const settings = await loadSettings(supabase);

    if (isDelivery) {
      if (!settings.delivery_enabled) {
        return json({ error: "Delivery is currently paused. Please choose takeaway or dine-in." }, 400);
      }
      const lat = Number(body.dest_lat);
      const lng = Number(body.dest_lng);
      const address = String(body.delivery_address ?? "").trim();
      const landmark = String(body.delivery_landmark ?? "").trim();

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return json({ error: "Please pick your delivery location on the map." }, 400);
      }
      if (!address) return json({ error: "A delivery address is required." }, 400);
      if (!phone) return json({ error: "A phone number is required for delivery." }, 400);

      const route = await computeRoute(
        { lat: settings.origin_lat, lng: settings.origin_lng },
        { lat, lng },
      );
      const fee = computeFee(settings, route.distance_km);
      if (fee.out_of_range) {
        return json({
          error: `That address is ${route.distance_km} km away, beyond our ${settings.max_delivery_km} km delivery range.`,
        }, 400);
      }
      const eta = etaRange(settings, route.travel_minutes);
      deliveryFee = fee.fee_ghs;
      deliveryPayload = {
        status: fee.requires_review ? "pending_review" : "confirmed",
        dest_address: address,
        dest_landmark: landmark || null,
        dest_lat: lat,
        dest_lng: lng,
        origin_lat: settings.origin_lat,
        origin_lng: settings.origin_lng,
        distance_km: route.distance_km,
        travel_minutes: route.travel_minutes,
        eta_min_minutes: eta.eta_min_minutes,
        eta_max_minutes: eta.eta_max_minutes,
        fee_ghs: fee.fee_ghs,
        fee_breakdown: { ...fee.breakdown, distance_source: route.source },
        requires_review: fee.requires_review,
      };
    }

    const total = Math.round((subtotal + deliveryFee) * 100) / 100;
    const orderId = crypto.randomUUID();
    const reference = newRef();

    const { error: orderError } = await supabase.from("food_orders").insert({
      id: orderId,
      reference_code: reference,
      guest_name: guestName,
      email,
      phone: phone || null,
      room_number: orderType === "room_service" ? roomNumber || null : null,
      order_type: orderType,
      status: "pending",
      notes: notes || null,
      subtotal_ghs: subtotal,
      delivery_fee_ghs: deliveryFee,
      total_ghs: total,
      delivery_address: isDelivery ? String(body.delivery_address ?? "").trim() : null,
      delivery_landmark: isDelivery ? String(body.delivery_landmark ?? "").trim() || null : null,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "cash_on_delivery" ? "cash_on_delivery" : "pending",
    });
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase
      .from("food_order_items")
      .insert(priced.map((p) => ({ ...p, food_order_id: orderId })));
    if (itemsError) {
      await supabase.from("food_orders").delete().eq("id", orderId);
      throw itemsError;
    }

    let trackingToken: string | null = null;
    if (deliveryPayload) {
      const { data: delivery, error: deliveryError } = await supabase
        .from("deliveries")
        .insert({ ...deliveryPayload, food_order_id: orderId })
        .select("id, tracking_token, status")
        .single();
      if (deliveryError) {
        await supabase.from("food_orders").delete().eq("id", orderId);
        throw deliveryError;
      }
      trackingToken = delivery.tracking_token;
      await supabase.from("delivery_status_history").insert({
        delivery_id: delivery.id,
        new_status: delivery.status,
        actor_role: "system",
        note: "Order placed by guest",
      });
    }

    return json({
      ok: true,
      order_id: orderId,
      reference_code: reference,
      subtotal_ghs: subtotal,
      delivery_fee_ghs: deliveryFee,
      total_ghs: total,
      tracking_token: settings.customer_tracking_enabled ? trackingToken : null,
      requires_review: !!deliveryPayload?.requires_review,
    });
  } catch (err) {
    console.error("place-food-order failed", err);
    return json({ error: "We could not place your order. Please try again." }, 500);
  }
});
