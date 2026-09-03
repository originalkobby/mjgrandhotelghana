import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.orderId === "string" ? body.orderId : null;
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error } = await supabase
      .from("food_orders")
      .select(
        "reference_code, guest_name, email, phone, room_number, order_type, notes, total_ghs, created_at, delivery_address, delivery_landmark, delivery_fee_ghs, delivery_zones(name), food_order_items(name, quantity, price_ghs, line_total_ghs)",
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      throw new Error("Order not found");
    }

    if (!order.email) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No email on order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const typeLabel: Record<string, string> = {
      dine_in: "Dine-in",
      room_service: "Room Service",
      takeaway: "Takeaway",
      delivery: "Delivery",
    };

    const zoneName = (order as any).delivery_zones?.name ?? null;
    const deliveryFee = Number(order.delivery_fee_ghs ?? 0);
    const isDelivery = order.order_type === "delivery";

    const firstName = String(order.guest_name || "Guest").trim().split(/\s+/)[0];

    const closingLine = (() => {
      switch (order.order_type) {
        case "dine_in":
          return "Your table order is being prepared — please quote your reference when you arrive at the restaurant.";
        case "room_service":
          return order.room_number
            ? `We'll bring your order up to Room ${order.room_number} shortly.`
            : "We'll bring your order up to your room shortly.";
        case "takeaway":
          return "We'll have it packed and ready for collection at the restaurant — we'll call you when it's ready.";
        case "delivery":
          return `We'll deliver to ${
            [zoneName, order.delivery_address].filter(Boolean).join(" · ") ||
            "your delivery address"
          } as soon as it's ready.`;
        default:
          return "Our kitchen is preparing your order.";
      }
    })();

    const readyEstimate = isDelivery
      ? "Typical delivery time is 45–60 minutes."
      : "Typical preparation time is 25–35 minutes.";



    const items = (order.food_order_items ?? []) as Array<{
      name: string;
      quantity: number;
      price_ghs: number;
      line_total_ghs: number;
    }>;

    const placedAt = new Date(order.created_at).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rows = items
      .map(
        (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">${i.name} <span style="color:#999;">× ${i.quantity}</span></td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">GH₵ ${Number(i.line_total_ghs).toFixed(2)}</td>
      </tr>`,
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#d4a574;font-size:22px;font-weight:normal;letter-spacing:2px;">MJ GRAND HOTEL</h1>
          <p style="margin:6px 0 0;color:#999;font-size:11px;letter-spacing:2px;font-family:Arial,sans-serif;text-transform:uppercase;">Restaurant</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;">Order Confirmed</h2>
          <p style="margin:0 0 24px;color:#666;font-size:14px;font-family:Arial,sans-serif;">
            Hi ${firstName}, thank you for your order — our kitchen has received it. ${closingLine} ${readyEstimate}
          </p>


          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;border-radius:6px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Reference</p>
              <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;font-family:monospace;font-weight:bold;">${order.reference_code}</p>
              <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Order Type</p>
              <p style="margin:0 0 16px;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">${typeLabel[order.order_type] ?? order.order_type}${order.room_number ? ` · Room ${order.room_number}` : ""}</p>
              ${
    isDelivery
      ? `<p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Delivery To</p>
              <p style="margin:0 0 16px;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">${zoneName ? `${zoneName} · ` : ""}${order.delivery_address ?? ""}${order.delivery_landmark ? ` (${order.delivery_landmark})` : ""}</p>`
      : ""
  }
              <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Placed</p>
              <p style="margin:0;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">${placedAt}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Order Summary</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${rows}
            ${
    isDelivery
      ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">Delivery${zoneName ? ` — ${zoneName}` : ""}</td>
              <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">GH₵ ${deliveryFee.toFixed(2)}</td>
            </tr>`
      : ""
  }
            <tr>
              <td style="padding:14px 0;color:#1a1a1a;font-size:15px;font-family:Arial,sans-serif;font-weight:bold;">Total</td>
              <td align="right" style="padding:14px 0;color:#1a1a1a;font-size:15px;font-family:Arial,sans-serif;font-weight:bold;">GH₵ ${Number(order.total_ghs).toFixed(2)}</td>
            </tr>
          </table>


          ${order.notes ? `<p style="margin:16px 0 0;color:#666;font-size:13px;font-family:Arial,sans-serif;"><strong>Notes:</strong> ${order.notes}</p>` : ""}

          <p style="margin:24px 0 0;color:#666;font-size:13px;font-family:Arial,sans-serif;">
            Payment is made on collection or delivery. Please quote your reference code.
          </p>
          <p style="margin:12px 0 0;color:#666;font-size:13px;font-family:Arial,sans-serif;">
            Need to change or cancel this order? Call us on
            <a href="tel:+233302544212" style="color:#b8860b;text-decoration:none;">+233 30 254 4212</a>
            and quote <strong>${order.reference_code}</strong>.
          </p>
        </td></tr>
        <tr><td style="background:#f8f7f4;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#999;font-size:12px;font-family:Arial,sans-serif;">MJ Grand Hotel · No. 460 Abotsi Street, East Legon, Accra</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MJ Grand Hotel <onboarding@resend.dev>",
        to: [order.email],
        subject: `Order ${order.reference_code} Confirmed`,
        html,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error("Resend error:", resData);
      throw new Error(resData.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-food-order-email error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
