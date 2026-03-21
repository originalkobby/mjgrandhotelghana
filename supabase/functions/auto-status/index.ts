import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function releaseInventoryForBooking(
  supabase: ReturnType<typeof createClient>,
  booking: { room_id: string; check_in: string; check_out: string }
) {
  let released = 0;
  const ciDate = new Date(booking.check_in);
  const coDate = new Date(booking.check_out);
  const d = new Date(ciDate);

  while (d < coDate) {
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
      released++;
    }

    d.setDate(d.getDate() + 1);
  }

  return released;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const results = { completed: 0, noShow: 0, inventoryReleased: 0 };

  try {
    // 1. Find all confirmed/pending bookings whose check_out <= today
    const { data: expiredBookings, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, room_id, check_in, check_out, status, payment_status")
      .in("status", ["confirmed", "pending"])
      .lte("check_out", todayStr);

    if (fetchErr) throw fetchErr;

    for (const booking of expiredBookings || []) {
      let newStatus: string;

      if (booking.payment_status === "paid") {
        // Paid → Completed
        newStatus = "completed";
        results.completed++;
      } else {
        // Not paid → No Show
        newStatus = "no_show";
        results.noShow++;
      }

      // Update booking status
      await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", booking.id);

      // Insert audit log
      await supabase.from("booking_audit_log").insert({
        booking_id: booking.id,
        old_status: booking.status,
        new_status: newStatus,
        note: `Auto-status: check-out date ${booking.check_out} reached. Payment: ${booking.payment_status}`,
      });

      results.inventoryReleased += await releaseInventoryForBooking(supabase, booking);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: (expiredBookings || []).length,
        ...results,
        timestamp: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Auto-status error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
