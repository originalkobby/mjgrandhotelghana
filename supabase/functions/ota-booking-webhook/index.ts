import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-webhook-signature, x-webhook-timestamp",
};

const REPLAY_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

// Normalise OTA source names
const SOURCE_MAP: Record<string, string> = {
  "booking.com": "booking_com",
  booking_com: "booking_com",
  expedia: "expedia",
  airbnb: "airbnb",
  agoda: "agoda",
  siteminder: "siteminder",
  cloudbeds: "cloudbeds",
  staah: "staah",
};

function normaliseSource(raw: string): string {
  return SOURCE_MAP[raw.toLowerCase().trim()] ?? raw.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface OTAPayload {
  event_type: "new" | "modify" | "cancel";
  source: string;
  ota_reference: string;
  room_name?: string;
  room_id?: string;
  check_in: string;
  check_out: string;
  adults?: number;
  children?: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  total_amount?: number;
  special_requests?: string;
  payment_status?: string;
}

function validatePayload(body: any): { valid: true; data: OTAPayload } | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Empty or invalid body" };
  if (!["new", "modify", "cancel"].includes(body.event_type)) return { valid: false, error: "event_type must be new|modify|cancel" };
  if (!body.source) return { valid: false, error: "source is required" };
  if (!body.ota_reference) return { valid: false, error: "ota_reference is required" };
  if (body.event_type !== "cancel") {
    if (!body.check_in || !body.check_out) return { valid: false, error: "check_in and check_out required" };
    if (!body.guest_name || !body.guest_email) return { valid: false, error: "guest_name and guest_email required" };
  }
  return { valid: true, data: body as OTAPayload };
}

async function resolveRoomId(supabase: any, payload: OTAPayload): Promise<string | null> {
  // If room_id provided, use it
  if (payload.room_id) {
    const { data } = await supabase.from("rooms").select("id").eq("id", payload.room_id).eq("is_active", true).maybeSingle();
    if (data) return data.id;
  }
  // Try matching by name
  if (payload.room_name) {
    const { data } = await supabase
      .from("rooms")
      .select("id")
      .ilike("name", `%${payload.room_name}%`)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return data.id;
  }
  // Fallback: first active room
  const { data } = await supabase.from("rooms").select("id, base_price_ghs").eq("is_active", true).order("sort_order").limit(1).maybeSingle();
  return data?.id ?? null;
}

async function upsertGuest(supabase: any, p: OTAPayload): Promise<string> {
  const { data: existing } = await supabase
    .from("guests")
    .select("id")
    .eq("email", p.guest_email.toLowerCase())
    .maybeSingle();

  if (existing) return existing.id;

  const { data } = await supabase
    .from("guests")
    .insert({ full_name: p.guest_name, email: p.guest_email.toLowerCase(), phone: p.guest_phone || null })
    .select("id")
    .single();

  return data.id;
}

async function updateInventory(supabase: any, roomId: string, checkIn: string, checkOut: string, increment: boolean) {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  const d = new Date(ci);
  while (d < co) {
    const dateStr = d.toISOString().split("T")[0];
    const { data: inv } = await supabase
      .from("room_inventory")
      .select("id, booked_count, total_count")
      .eq("room_id", roomId)
      .eq("date", dateStr)
      .maybeSingle();

    if (inv) {
      const newCount = increment
        ? inv.booked_count + 1
        : Math.max(0, inv.booked_count - 1);
      await supabase.from("room_inventory").update({ booked_count: newCount }).eq("id", inv.id);
    } else if (increment) {
      await supabase.from("room_inventory").insert({
        room_id: roomId,
        date: dateStr,
        total_count: 1,
        booked_count: 1,
      });
    }
    d.setDate(d.getDate() + 1);
  }
}

async function logWebhook(supabase: any, eventType: string, source: string, payload: any, status: string, bookingId?: string, errorMsg?: string) {
  await supabase.from("webhook_logs").insert({
    event_type: eventType,
    source,
    payload,
    status,
    booking_id: bookingId ?? null,
    error_message: errorMsg ?? null,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // --- Layer 1: Static shared-secret validation ---
  const webhookSecret = Deno.env.get("OTA_WEBHOOK_SECRET");
  if (webhookSecret) {
    const providedSecret = req.headers.get("x-webhook-secret") || new URL(req.url).searchParams.get("secret");
    if (providedSecret !== webhookSecret) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  // Read raw body once for HMAC validation + JSON parsing
  const rawBody = await req.text();

  // --- Layer 2: HMAC-SHA256 signature validation ---
  const hmacSecret = Deno.env.get("OTA_WEBHOOK_SECRET");
  const signature = req.headers.get("x-webhook-signature");
  if (hmacSecret && signature) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(hmacSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const provided = signature.replace(/^sha256=/, "").toLowerCase();
    if (provided !== expected) {
      return json({ error: "Invalid HMAC signature" }, 401);
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const validation = validatePayload(body);
  if (!validation.valid) {
    await logWebhook(supabase, body?.event_type ?? "unknown", body?.source ?? "unknown", body, "error", undefined, validation.error);
    return json({ error: validation.error }, 400);
  }

  const payload = validation.data;
  const source = normaliseSource(payload.source);

  try {
    // --- CANCEL ---
    if (payload.event_type === "cancel") {
      const { data: existing } = await supabase
        .from("bookings")
        .select("id, status, room_id, check_in, check_out")
        .eq("ota_reference", payload.ota_reference)
        .maybeSingle();

      if (!existing) {
        await logWebhook(supabase, "cancel", source, body, "error", undefined, "Booking not found");
        return json({ error: "Booking not found for ota_reference" }, 404);
      }

      if (existing.status === "cancelled") {
        await logWebhook(supabase, "cancel", source, body, "skipped", existing.id, "Already cancelled");
        return json({ status: "already_cancelled", booking_id: existing.id });
      }

      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", existing.id);
      await updateInventory(supabase, existing.room_id, existing.check_in, existing.check_out, false);
      await logWebhook(supabase, "cancel", source, body, "success", existing.id);

      return json({ status: "cancelled", booking_id: existing.id });
    }

    // --- NEW or MODIFY ---
    const roomId = await resolveRoomId(supabase, payload);
    if (!roomId) {
      await logWebhook(supabase, payload.event_type, source, body, "error", undefined, "Room not found");
      return json({ error: "Could not resolve room" }, 400);
    }

    // Get room price for total calculation
    const { data: room } = await supabase.from("rooms").select("base_price_ghs").eq("id", roomId).single();
    const nights = Math.ceil((new Date(payload.check_out).getTime() - new Date(payload.check_in).getTime()) / 86400000);
    const totalAmount = payload.total_amount ?? (room?.base_price_ghs ?? 0) * nights;

    const guestId = await upsertGuest(supabase, payload);

    // Check if booking already exists (for modify or duplicate new)
    const { data: existing } = await supabase
      .from("bookings")
      .select("id, room_id, check_in, check_out, status")
      .eq("ota_reference", payload.ota_reference)
      .maybeSingle();

    if (existing) {
      // MODIFY existing booking
      // Release old inventory
      if (existing.status !== "cancelled") {
        await updateInventory(supabase, existing.room_id, existing.check_in, existing.check_out, false);
      }

      await supabase.from("bookings").update({
        room_id: roomId,
        check_in: payload.check_in,
        check_out: payload.check_out,
        adults: payload.adults ?? 1,
        children: payload.children ?? 0,
        guest_id: guestId,
        base_total_ghs: totalAmount,
        final_total_ghs: totalAmount,
        special_requests: payload.special_requests ?? null,
        payment_status: payload.payment_status ?? "pending",
        status: "confirmed",
        booking_source: source,
      }).eq("id", existing.id);

      // Increment new inventory
      await updateInventory(supabase, roomId, payload.check_in, payload.check_out, true);
      await logWebhook(supabase, "modify", source, body, "success", existing.id);

      return json({ status: "modified", booking_id: existing.id });
    }

    // NEW booking
    const refCode = "MJ-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        reference_code: refCode,
        ota_reference: payload.ota_reference,
        booking_source: source,
        guest_id: guestId,
        room_id: roomId,
        check_in: payload.check_in,
        check_out: payload.check_out,
        adults: payload.adults ?? 1,
        children: payload.children ?? 0,
        base_total_ghs: totalAmount,
        add_ons_total_ghs: 0,
        discount_ghs: 0,
        final_total_ghs: totalAmount,
        special_requests: payload.special_requests ?? null,
        status: "confirmed",
        payment_status: payload.payment_status ?? "pending",
      })
      .select("id")
      .single();

    if (bookingErr) {
      await logWebhook(supabase, "new", source, body, "error", undefined, bookingErr.message);
      return json({ error: "Failed to create booking" }, 500);
    }

    await updateInventory(supabase, roomId, payload.check_in, payload.check_out, true);
    await logWebhook(supabase, "new", source, body, "success", booking.id);

    return json({ status: "created", booking_id: booking.id, reference_code: refCode });
  } catch (err) {
    console.error("OTA webhook error:", err);
    await logWebhook(supabase, payload.event_type, source, body, "error", undefined, String(err));
    return json({ error: "Internal server error" }, 500);
  }
});
