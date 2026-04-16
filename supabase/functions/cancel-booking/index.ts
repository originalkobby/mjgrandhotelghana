import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { referenceCode } = await req.json();

    if (!referenceCode || typeof referenceCode !== "string") {
      return new Response(JSON.stringify({ error: "referenceCode is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch booking
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, status, check_in, check_out, room_id, guest_id")
      .eq("reference_code", referenceCode.toUpperCase().trim())
      .single();

    if (fetchErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.status !== "confirmed" && booking.status !== "pending") {
      return new Response(JSON.stringify({ error: `Cannot cancel a ${booking.status} booking` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side 48-hour cancellation window check
    const checkInDate = new Date(booking.check_in + "T14:00:00");
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < 48) {
      return new Response(
        JSON.stringify({ error: "Cancellations must be made at least 48 hours before check-in" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update booking status
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Failed to cancel booking" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Release inventory
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const d = new Date(checkIn);
    while (d < checkOut) {
      const dateStr = d.toISOString().split("T")[0];
      const { data: inv } = await supabase
        .from("room_inventory")
        .select("id, booked_count")
        .eq("room_id", booking.room_id)
        .eq("date", dateStr)
        .maybeSingle();

      if (inv && inv.booked_count > 0) {
        await supabase
          .from("room_inventory")
          .update({ booked_count: inv.booked_count - 1 })
          .eq("id", inv.id);
      }
      d.setDate(d.getDate() + 1);
    }

    // Audit log
    await supabase.from("booking_audit_log").insert({
      booking_id: booking.id,
      old_status: booking.status,
      new_status: "cancelled",
      note: "Cancelled by guest via booking lookup",
    });

    // Send cancellation email
    try {
      await supabase.functions.invoke("send-cancellation-email", {
        body: { bookingId: booking.id },
      });
    } catch (e) {
      console.error("Failed to send cancellation email:", e);
    }

    return new Response(
      JSON.stringify({ success: true, bookingId: booking.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Cancel booking error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
