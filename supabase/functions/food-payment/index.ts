import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientKey, corsHeaders, json, rateLimit } from "../_shared/delivery.ts";

/**
 * Paystack payments for restaurant / delivery orders.
 *  - initialize: starts a checkout for an existing, unpaid food order
 *  - verify:     confirms the transaction server-side and marks the order paid
 * Amounts always come from the database, never from the browser.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secret) return json({ error: "Online payment is not configured yet." }, 500);

  try {
    if (!rateLimit(`foodpay:${clientKey(req)}`, 20, 10 * 60_000)) {
      return json({ error: "Too many payment attempts. Please try again shortly." }, 429);
    }

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const action = String(body.action ?? "");

    if (action === "initialize") {
      const orderId = String(body.order_id ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "Invalid order." }, 400);

      const { data: order, error } = await supabase
        .from("food_orders")
        .select("id, reference_code, email, total_ghs, payment_status, status")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      if (!order) return json({ error: "Order not found." }, 404);
      if (order.payment_status === "paid") return json({ error: "This order is already paid." }, 400);
      if (!order.email) return json({ error: "An email is required to pay online." }, 400);

      const amount = Math.round(Number(order.total_ghs) * 100); // pesewas
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Invalid amount." }, 400);

      const origin = String(body.origin ?? "").replace(/\/$/, "");
      const callbackUrl = /^https?:\/\//.test(origin)
        ? `${origin}/food-order?pay=${encodeURIComponent(order.reference_code)}`
        : undefined;

      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: order.email,
          amount,
          currency: "GHS",
          callback_url: callbackUrl,
          metadata: { food_order_id: order.id, reference_code: order.reference_code },
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.status) {
        console.error("Paystack initialize failed", payload);
        return json({ error: payload?.message ?? "Could not start the payment." }, 502);
      }

      await supabase
        .from("food_orders")
        .update({ paystack_reference: payload.data.reference, payment_method: "paystack" })
        .eq("id", order.id);

      return json({
        ok: true,
        authorization_url: payload.data.authorization_url,
        reference: payload.data.reference,
      });
    }

    if (action === "verify") {
      const reference = String(body.reference ?? "").trim();
      if (!reference || reference.length > 120) return json({ error: "Invalid payment reference." }, 400);

      const res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${secret}` } },
      );
      const payload = await res.json();
      if (!res.ok || !payload?.status) {
        console.error("Paystack verify failed", payload);
        return json({ error: payload?.message ?? "Could not verify the payment." }, 502);
      }

      const paid = payload.data?.status === "success";
      const orderId = payload.data?.metadata?.food_order_id ?? null;

      const query = supabase
        .from("food_orders")
        .select("id, reference_code, total_ghs, payment_status");
      const { data: order } = orderId
        ? await query.eq("id", orderId).maybeSingle()
        : await query.eq("paystack_reference", reference).maybeSingle();

      if (!order) return json({ error: "We could not match that payment to an order." }, 404);

      const expected = Math.round(Number(order.total_ghs) * 100);
      const amountOk = Number(payload.data?.amount) >= expected;

      if (paid && amountOk && order.payment_status !== "paid") {
        await supabase
          .from("food_orders")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            paystack_reference: reference,
          })
          .eq("id", order.id);
      }

      return json({
        ok: true,
        paid: paid && amountOk,
        reference_code: order.reference_code,
        amount_ghs: Number(order.total_ghs),
      });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    console.error("food-payment failed", err);
    return json({ error: "Payment could not be processed. Please try again." }, 500);
  }
});
