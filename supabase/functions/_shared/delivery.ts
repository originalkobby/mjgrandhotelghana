// Shared delivery helpers: settings, distance, pricing, ETA.
// Used by delivery-quote, place-food-order, delivery-action, track-order.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export type DeliverySettings = {
  id: string;
  delivery_enabled: boolean;
  origin_name: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  reference_rate_ghs: number;
  discount_percent: number;
  base_fee_ghs: number;
  price_per_km_ghs: number;
  min_fee_ghs: number;
  max_fee_ghs: number;
  manual_review_km: number;
  max_delivery_km: number;
  peak_start_hour: number;
  peak_end_hour: number;
  peak_uplift_percent: number;
  default_prep_minutes: number;
  eta_buffer_minutes: number;
  auto_assign_riders: boolean;
  customer_tracking_enabled: boolean;
  delivery_emails_enabled: boolean;
  rider_ping_seconds: number;
  offer_timeout_seconds: number;
  max_dispatch_attempts: number;
};

const FALLBACK_SETTINGS: DeliverySettings = {
  id: "fallback",
  delivery_enabled: true,
  origin_name: "MJ Grand Hotel",
  origin_address: "No. 460 Abotsi Street, East Legon, Accra, Ghana",
  origin_lat: 5.6358,
  origin_lng: -0.1577,
  reference_rate_ghs: 30,
  discount_percent: 10,
  base_fee_ghs: 8,
  price_per_km_ghs: 3.5,
  min_fee_ghs: 10,
  max_fee_ghs: 100,
  manual_review_km: 20,
  max_delivery_km: 60,
  peak_start_hour: 18,
  peak_end_hour: 21,
  peak_uplift_percent: 0,
  default_prep_minutes: 25,
  eta_buffer_minutes: 10,
  auto_assign_riders: false,
  customer_tracking_enabled: true,
  delivery_emails_enabled: true,
  rider_ping_seconds: 20,
  offer_timeout_seconds: 60,
  max_dispatch_attempts: 3,
};

/** Loads the singleton settings row; never throws — falls back to safe defaults. */
export async function loadSettings(supabase: any): Promise<DeliverySettings> {
  try {
    const { data, error } = await supabase
      .from("delivery_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error || !data) return FALLBACK_SETTINGS;
    const out: any = { ...FALLBACK_SETTINGS };
    for (const k of Object.keys(FALLBACK_SETTINGS)) {
      const v = (data as any)[k];
      if (v === null || v === undefined) continue;
      out[k] = typeof (FALLBACK_SETTINGS as any)[k] === "number" ? Number(v) : v;
    }
    return out as DeliverySettings;
  } catch {
    return FALLBACK_SETTINGS;
  }
}

export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export type RouteResult = {
  distance_km: number;
  travel_minutes: number;
  source: "google" | "estimate";
};

/**
 * Road distance via the Google Routes API using the server-side key.
 * Falls back to a straight-line estimate (x1.35 road factor) on any failure,
 * so a Maps outage can never stop an order.
 */
export async function computeRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): Promise<RouteResult> {
  const estimate = (): RouteResult => {
    const straight = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
    const km = Math.round(straight * 1.35 * 100) / 100;
    return {
      distance_km: km,
      travel_minutes: Math.max(5, Math.round((km / 22) * 60)),
      source: "estimate",
    };
  };

  const connKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!connKey || !lovableKey) return estimate();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/routes/directions/v2:computeRoutes",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": connKey,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: { latitude: origin.lat, longitude: origin.lng },
            },
          },
          destination: {
            location: { latLng: { latitude: dest.lat, longitude: dest.lng } },
          },
          travelMode: "TWO_WHEELER",
          routingPreference: "TRAFFIC_AWARE",
        }),
      },
    );
    clearTimeout(timer);
    if (!res.ok) return estimate();
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.distanceMeters) return estimate();
    const km = Math.round((route.distanceMeters / 1000) * 100) / 100;
    const seconds = Number(String(route.duration ?? "0s").replace("s", ""));
    return {
      distance_km: km,
      travel_minutes: Math.max(5, Math.round((seconds || (km / 22) * 3600) / 60)),
      source: "google",
    };
  } catch {
    return estimate();
  }
}

export type FeeResult = {
  fee_ghs: number;
  requires_review: boolean;
  out_of_range: boolean;
  breakdown: Record<string, unknown>;
};

export function computeFee(
  s: DeliverySettings,
  distanceKm: number,
  at: Date = new Date(),
): FeeResult {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const raw = s.base_fee_ghs + distance * s.price_per_km_ghs;

  // Accra local hour (UTC+0) — Ghana has no DST offset.
  const hour = at.getUTCHours();
  const peak =
    s.peak_uplift_percent > 0 &&
    (s.peak_start_hour <= s.peak_end_hour
      ? hour >= s.peak_start_hour && hour <= s.peak_end_hour
      : hour >= s.peak_start_hour || hour <= s.peak_end_hour);
  const withPeak = peak ? raw * (1 + s.peak_uplift_percent / 100) : raw;

  const discount = withPeak * (s.discount_percent / 100);
  const discounted = withPeak - discount;

  const clamped = Math.min(s.max_fee_ghs, Math.max(s.min_fee_ghs, discounted));
  const fee = Math.round(clamped * 100) / 100;

  return {
    fee_ghs: fee,
    requires_review: distance > s.manual_review_km,
    out_of_range: distance > s.max_delivery_km,
    breakdown: {
      distance_km: distance,
      base_fee_ghs: s.base_fee_ghs,
      price_per_km_ghs: s.price_per_km_ghs,
      distance_component_ghs: Math.round(distance * s.price_per_km_ghs * 100) / 100,
      peak_applied: peak,
      peak_uplift_percent: peak ? s.peak_uplift_percent : 0,
      discount_percent: s.discount_percent,
      discount_ghs: Math.round(discount * 100) / 100,
      reference_rate_ghs: s.reference_rate_ghs,
      min_fee_ghs: s.min_fee_ghs,
      max_fee_ghs: s.max_fee_ghs,
      computed_at: at.toISOString(),
    },
  };
}

export function etaRange(s: DeliverySettings, travelMinutes: number) {
  const min = s.default_prep_minutes + travelMinutes;
  return { eta_min_minutes: min, eta_max_minutes: min + s.eta_buffer_minutes };
}

/** Valid forward transitions for a delivery. Anything else is rejected. */
export const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  pending_review: ["confirmed", "review_rejected", "cancelled"],
  review_rejected: ["cancelled", "confirmed"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["rider_assigned", "cancelled"],
  rider_assigned: ["rider_accepted", "ready_for_pickup", "cancelled"],
  rider_accepted: ["rider_picked_up", "cancelled"],
  rider_picked_up: ["on_the_way", "cancelled"],
  on_the_way: ["delivered", "failed"],
  delivered: [],
  cancelled: [],
  failed: ["on_the_way", "cancelled"],
};

export function canTransition(from: string, to: string): boolean {
  return (DELIVERY_TRANSITIONS[from] ?? []).includes(to);
}

/** Simple in-memory sliding-window rate limiter (per isolate). */
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

export function clientKey(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
