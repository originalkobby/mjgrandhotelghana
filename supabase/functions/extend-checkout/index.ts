import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { bookingId, newCheckOut } = await req.json();

    if (!bookingId || !newCheckOut) {
      return new Response(
        JSON.stringify({ error: "bookingId and newCheckOut are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current booking
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, room_id, check_in, check_out, base_total_ghs, add_ons_total_ghs, discount_ghs, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (booking.status === "cancelled" || booking.status === "no_show") {
      return new Response(
        JSON.stringify({ error: `Cannot extend a ${booking.status} booking` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const oldCheckOut = new Date(booking.check_out);
    const newCheckOutDate = new Date(newCheckOut);

    if (newCheckOutDate <= oldCheckOut) {
      return new Response(
        JSON.stringify({ error: "New check-out must be after the current check-out" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get room's nightly rate
    const { data: room } = await supabase
      .from("rooms")
      .select("base_price_ghs")
      .eq("id", booking.room_id)
      .single();

    const nightlyRate = room?.base_price_ghs ?? 0;

    // Calculate extra nights
    const extraNights = Math.ceil(
      (newCheckOutDate.getTime() - oldCheckOut.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check availability for the extra dates
    const d = new Date(oldCheckOut);
    const extraDates: string[] = [];
    while (d < newCheckOutDate) {
      extraDates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }

    for (const date of extraDates) {
      const { data: inv } = await supabase
        .from("room_inventory")
        .select("id, booked_count, total_count, is_closed")
        .eq("room_id", booking.room_id)
        .eq("date", date)
        .maybeSingle();

      if (inv) {
        if (inv.is_closed || inv.booked_count >= inv.total_count) {
          return new Response(
            JSON.stringify({ error: `Room not available on ${date}` }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Increment inventory for the extra dates
    for (const date of extraDates) {
      const { data: inv } = await supabase
        .from("room_inventory")
        .select("id, booked_count")
        .eq("room_id", booking.room_id)
        .eq("date", date)
        .maybeSingle();

      if (inv) {
        await supabase
          .from("room_inventory")
          .update({ booked_count: inv.booked_count + 1 })
          .eq("id", inv.id);
      } else {
        await supabase.from("room_inventory").insert({
          room_id: booking.room_id,
          date,
          total_count: 1,
          booked_count: 1,
        });
      }
    }

    // Update booking totals
    const extraCost = nightlyRate * extraNights;
    const newBaseTotal = Number(booking.base_total_ghs) + extraCost;
    const newFinalTotal = newBaseTotal + Number(booking.add_ons_total_ghs) - Number(booking.discount_ghs);

    await supabase
      .from("bookings")
      .update({
        check_out: newCheckOut,
        base_total_ghs: newBaseTotal,
        final_total_ghs: newFinalTotal,
      })
      .eq("id", bookingId);

    // Audit log
    await supabase.from("booking_audit_log").insert({
      booking_id: bookingId,
      old_status: booking.status,
      new_status: booking.status,
      note: `Checkout extended from ${booking.check_out} to ${newCheckOut} (+${extraNights} nights, +GHS ${extraCost})`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        extraNights,
        extraCost,
        newCheckOut,
        newBaseTotal,
        newFinalTotal,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Extend checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
