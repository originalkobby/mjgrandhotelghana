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

  try {
    const { reference } = await req.json();
    if (!reference || typeof reference !== "string") {
      return new Response(JSON.stringify({ error: "Reference code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rawRef = reference.trim();
    const upperRef = rawRef.toUpperCase();

    const selectClause = `
      id, reference_code, status, payment_status, check_in, check_out,
      adults, children, special_requests, arrival_time, nationality,
      base_total_ghs, add_ons_total_ghs, discount_ghs, final_total_ghs,
      promo_code, booking_source, created_at,
      rooms ( name ),
      guests ( full_name, email, phone )
    `;

    // Try internal reference first
    const { data: internalBooking, error: intErr } = await supabase
      .from("bookings")
      .select(selectClause)
      .eq("reference_code", upperRef)
      .maybeSingle();

    if (intErr) throw intErr;
    if (internalBooking) {
      return new Response(JSON.stringify({ booking: internalBooking }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try OTA reference
    for (const otaRef of new Set([rawRef, upperRef])) {
      const { data: otaBooking, error: otaErr } = await supabase
        .from("bookings")
        .select(selectClause)
        .eq("ota_reference", otaRef)
        .maybeSingle();

      if (otaErr) throw otaErr;
      if (otaBooking) {
        return new Response(JSON.stringify({ booking: otaBooking }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ booking: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Lookup booking error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
