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

  const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!PAYSTACK_SECRET) {
    return new Response(
      JSON.stringify({ error: "Paystack secret key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, ...payload } = await req.json();

    // ── Initialize transaction ──
    if (action === "initialize") {
      const { email, booking_reference, callback_url } = payload;

      if (!booking_reference || !email) {
        return new Response(JSON.stringify({ error: "booking_reference and email are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up the booking from DB to get the authoritative amount and verify guest email
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .select("final_total_ghs, status, payment_status, guests ( email )")
        .eq("reference_code", booking_reference)
        .single();

      if (bookingErr || !booking) {
        // Generic message — do not reveal whether the reference exists
        return new Response(JSON.stringify({ error: "Unable to initialize payment for this booking" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Identity check: submitted email must match booking guest email
      const onFile = (booking as any).guests?.email?.toLowerCase().trim();
      const submitted = String(email).toLowerCase().trim();
      if (!onFile || onFile !== submitted) {
        console.warn(`Paystack init: email mismatch for ${booking_reference}`);
        return new Response(JSON.stringify({ error: "Unable to initialize payment for this booking" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (booking.payment_status === "paid") {
        return new Response(JSON.stringify({ error: "Booking is already paid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use server-side amount from DB, never from client
      const amount_ghs = Number(booking.final_total_ghs);

      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount_ghs * 100), // Paystack uses pesewas
          currency: "GHS",
          reference: booking_reference,
          callback_url,
          metadata: { booking_reference },
        }),
      });

      const data = await res.json();
      if (!data.status) {
        return new Response(JSON.stringify({ error: data.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Verify transaction ──
    if (action === "verify") {
      const { reference } = payload;

      const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });

      const data = await res.json();
      if (!data.status) {
        return new Response(JSON.stringify({ error: data.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const txn = data.data;
      const isPaid = txn.status === "success";

      // Log payment
      await supabase.from("payment_logs").insert({
        booking_id: txn.metadata?.booking_id || null,
        amount_ghs: txn.amount / 100,
        currency: txn.currency,
        provider: "paystack",
        provider_reference: txn.reference,
        status: txn.status,
        metadata: txn,
      });

      // Update booking payment status
      if (isPaid) {
        await supabase
          .from("bookings")
          .update({ payment_status: "paid" })
          .eq("reference_code", reference);
      }

      return new Response(
        JSON.stringify({ verified: isPaid, status: txn.status, amount: txn.amount / 100 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
