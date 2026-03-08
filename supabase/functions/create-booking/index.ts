import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
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

    // --- Validate email ---
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
    const { data: recentDuplicate } = await supabase
      .from("bookings")
      .select("id, reference_code")
      .eq("room_id", booking.roomId)
      .eq("check_in", booking.checkIn)
      .eq("check_out", booking.checkOut)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .limit(1);

    if (recentDuplicate && recentDuplicate.length > 0) {
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

    // --- Promo Code Validation ---
    let discountGhs = 0;
    if (booking.promoCode) {
      const { data: promo } = await supabase
        .from("promotions")
        .select("*")
        .eq("code", booking.promoCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promo) {
        const now = new Date().toISOString().split("T")[0];
        const validStart = !promo.start_date || promo.start_date <= now;
        const validEnd = !promo.end_date || promo.end_date >= now;
        const withinLimit = !promo.usage_limit || promo.usage_count < promo.usage_limit;
        const roomAllowed = !promo.room_restrictions || promo.room_restrictions.length === 0 || promo.room_restrictions.includes(booking.roomId);

        if (validStart && validEnd && withinLimit && roomAllowed) {
          if (promo.discount_type === "percentage") {
            discountGhs = Math.round((booking.baseTotalGhs * promo.discount_value) / 100);
          } else if (promo.discount_type === "fixed") {
            discountGhs = Math.min(promo.discount_value, booking.baseTotalGhs);
          }

          // Increment usage count
          await supabase
            .from("promotions")
            .update({ usage_count: promo.usage_count + 1 })
            .eq("id", promo.id);
        }
      }
    }

    // Recalculate final total with discount
    const addOnsTotal = booking.addOnsTotalGhs || 0;
    const finalTotal = booking.baseTotalGhs + addOnsTotal - discountGhs;

    // --- Upsert guest ---
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
        add_ons_total_ghs: addOnsTotal,
        discount_ghs: discountGhs,
        final_total_ghs: finalTotal,
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

    // --- Increment room_inventory.booked_count for each night ---
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const dates: string[] = [];
    const d = new Date(checkInDate);
    while (d < checkOutDate) {
      dates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }

    for (const date of dates) {
      // Try to find existing inventory row
      const { data: inv } = await supabase
        .from("room_inventory")
        .select("id, booked_count")
        .eq("room_id", booking.roomId)
        .eq("date", date)
        .maybeSingle();

      if (inv) {
        await supabase
          .from("room_inventory")
          .update({ booked_count: inv.booked_count + 1 })
          .eq("id", inv.id);
      } else {
        // Create inventory row with booked_count = 1
        await supabase
          .from("room_inventory")
          .insert({
            room_id: booking.roomId,
            date,
            total_count: 1,
            booked_count: 1,
          });
      }
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
      JSON.stringify({
        reference: refCode,
        bookingId: bookingData.id,
        discountGhs,
        finalTotal,
      }),
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
