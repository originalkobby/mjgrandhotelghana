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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!rateLimit(`quote:${clientKey(req)}`, 40, 60_000)) {
      return json({ error: "Too many requests. Please slow down." }, 429);
    }

    const body = await req.json().catch(() => ({}));
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return json({ error: "A valid delivery location is required." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const settings = await loadSettings(supabase);
    if (!settings.delivery_enabled) {
      return json({ delivery_enabled: false, message: "Delivery is currently paused." });
    }

    const route = await computeRoute(
      { lat: settings.origin_lat, lng: settings.origin_lng },
      { lat, lng },
    );
    const fee = computeFee(settings, route.distance_km);
    const eta = etaRange(settings, route.travel_minutes);

    return json({
      delivery_enabled: true,
      distance_km: route.distance_km,
      distance_source: route.source,
      travel_minutes: route.travel_minutes,
      ...eta,
      fee_ghs: fee.fee_ghs,
      requires_review: fee.requires_review,
      out_of_range: fee.out_of_range,
      max_delivery_km: settings.max_delivery_km,
      breakdown: fee.breakdown,
      origin: {
        name: settings.origin_name,
        address: settings.origin_address,
        lat: settings.origin_lat,
        lng: settings.origin_lng,
      },
    });
  } catch (err) {
    console.error("delivery-quote failed", err);
    return json({ error: "Could not calculate a delivery fee right now." }, 500);
  }
});
