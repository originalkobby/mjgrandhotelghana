import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncToConvex } from "../_shared/convexSync.ts";

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

      // Look up the booking from DB to get the authoritative amount
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .select("final_total_ghs, status, payment_status, group_ref")
        .eq("reference_code", booking_reference)
        .single();

      if (bookingErr || !booking) {
        return new Response(JSON.stringify({ error: "Booking not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (booking.payment_status === "paid") {
        return new Response(JSON.stringify({ error: "Booking is already paid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use server-side amount from DB, never from client.
      // Group bookings are charged as a single transaction across all rooms.
      let amount_ghs = Number(booking.final_total_ghs);
      if (booking.group_ref) {
        const { data: groupRows } = await supabase
          .from("bookings")
          .select("final_total_ghs")
          .eq("group_ref", booking.group_ref);
        if (groupRows && groupRows.length > 0) {
          amount_ghs = groupRows.reduce((s, r) => s + Number(r.final_total_ghs), 0);
        }
      }


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
      const { reference, email } = payload;

      if (!reference || typeof reference !== "string") {
        return new Response(JSON.stringify({ error: "reference is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SECURITY: authorise the caller before exposing payment status or hitting
      // the Paystack API. Look up the booking + guest email, then require either
      //  (a) the booking is already marked paid — return cached status, no external call
      //  (b) the caller supplied the matching guest email (proves booking ownership)
      const { data: bookingRow } = await supabase
        .from("bookings")
        .select("id, payment_status, final_total_ghs, guests(email)")
        .eq("reference_code", reference)
        .maybeSingle();

      if (!bookingRow) {
        // Do not reveal whether the reference exists at Paystack either.
        return new Response(JSON.stringify({ error: "Not authorised" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Short-circuit: already paid — return cached status without calling Paystack.
      if (bookingRow.payment_status === "paid") {
        return new Response(
          JSON.stringify({
            verified: true,
            status: "success",
            amount: Number(bookingRow.final_total_ghs),
            cached: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const bookingEmail = ((bookingRow as any).guests?.email || "").toLowerCase();
      const providedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
      if (!providedEmail || providedEmail !== bookingEmail) {
        return new Response(JSON.stringify({ error: "Not authorised" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      // Update booking payment status (all rooms when part of a group booking)
      if (isPaid) {
        const { data: paidRef } = await supabase
          .from("bookings")
          .select("group_ref")
          .eq("reference_code", reference)
          .maybeSingle();

        if (paidRef?.group_ref) {
          await supabase
            .from("bookings")
            .update({ payment_status: "paid" })
            .eq("group_ref", paidRef.group_ref);
        } else {
          await supabase
            .from("bookings")
            .update({ payment_status: "paid" })
            .eq("reference_code", reference);
        }


        // Fire-and-forget dual-write to Convex
        syncToConvex({
          event: "booking.payment_updated",
          referenceCode: reference,
          data: {
            paymentStatus: "paid",
            provider: "paystack",
            providerReference: txn.reference,
            amountGhs: txn.amount / 100,
          },
        });
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
