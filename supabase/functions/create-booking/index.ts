import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // max 3 bookings per email per hour

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { guest, booking, addOns } = await req.json();

    // --- Rate Limiting ---
    if (!guest?.email || typeof guest.email !== "string") {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(guest.email)) {
      return new Response(
        JSON.stringify({ error: "Too many booking requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Duplicate Detection ---
    // Block identical bookings (same email, room, dates) within 10 minutes
    const { data: recentDuplicate } = await supabase
      .from("bookings")
      .select("id, reference_code")
      .eq("room_id", booking.roomId)
      .eq("check_in", booking.checkIn)
      .eq("check_out", booking.checkOut)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .limit(1);

    if (recentDuplicate && recentDuplicate.length > 0) {
      // Also verify it's the same guest by email
      const dupBooking = recentDuplicate[0];
      const { data: dupGuest } = await supabase
        .from("bookings")
        .select("guests!inner(email)")
        .eq("id", dupBooking.id)
        .single();

      if ((dupGuest as any)?.guests?.email?.toLowerCase() === guest.email.toLowerCase().trim()) {
        return new Response(
          JSON.stringify({
            error: "A similar booking was already made recently.",
            existingReference: dupBooking.reference_code,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Upsert guest
    let guestId: string | null = null;
    const { data: existingGuest } = await supabase
      .from("guests")
      .select("id")
      .eq("email", guest.email)
      .maybeSingle();

    if (existingGuest) {
      guestId = existingGuest.id;
    } else {
      const { data: newGuest } = await supabase
        .from("guests")
        .insert({
          full_name: guest.fullName,
          email: guest.email,
          phone: guest.phone,
        })
        .select("id")
        .single();
      guestId = newGuest?.id ?? null;
    }

    // Generate reference
    const refCode = "MJ-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create booking
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        reference_code: refCode,
        guest_id: guestId,
        room_id: booking.roomId,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        adults: booking.adults,
        children: booking.children,
        base_total_ghs: booking.baseTotalGhs,
        add_ons_total_ghs: booking.addOnsTotalGhs,
        discount_ghs: 0,
        final_total_ghs: booking.finalTotalGhs,
        promo_code: booking.promoCode || null,
        special_requests: booking.specialRequests || null,
        arrival_time: booking.arrivalTime || null,
        nationality: booking.nationality || null,
        status: "confirmed",
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      return new Response(JSON.stringify({ error: bookingError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert add-ons
    if (addOns && addOns.length > 0 && bookingData) {
      await supabase.from("booking_add_ons").insert(
        addOns.map((a: any) => ({
          booking_id: bookingData.id,
          add_on_id: a.id,
          quantity: a.quantity,
          unit_price_ghs: a.priceGhs,
          total_price_ghs: a.priceGhs * a.quantity,
        }))
      );
    }

    return new Response(
      JSON.stringify({ reference: refCode, bookingId: bookingData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Create booking error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
