import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, loadSettings } from "../_shared/delivery.ts";

const GOLD = "#D4AF37";
const CHARCOAL = "#1c1b19";

type Stage =
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "on_the_way"
  | "delivered"
  | "cancelled"
  | "review_rejected";

const SUBJECTS: Record<Stage, (ref: string) => string> = {
  confirmed: (r) => `Order ${r} confirmed — MJ Grand Hotel`,
  preparing: (r) => `We're cooking your order ${r} — MJ Grand Hotel`,
  ready_for_pickup: (r) => `Order ${r} is ready — MJ Grand Hotel`,
  on_the_way: (r) => `Your order ${r} is on its way — MJ Grand Hotel`,
  delivered: (r) => `Order ${r} delivered — thank you`,
  cancelled: (r) => `Order ${r} cancelled — MJ Grand Hotel`,
  review_rejected: (r) => `About your delivery request ${r} — MJ Grand Hotel`,
};

const HEADLINES: Record<Stage, string> = {
  confirmed: "Your order is confirmed",
  preparing: "Your food is being prepared",
  ready_for_pickup: "Your order is ready",
  on_the_way: "Your order is on its way",
  delivered: "Delivered — enjoy your meal",
  cancelled: "Your order has been cancelled",
  review_rejected: "We can't deliver to that address",
};

const INTROS: Record<Stage, string> = {
  confirmed: "Our restaurant team has accepted your order and started preparing it.",
  preparing: "Our chefs are preparing your dishes right now.",
  ready_for_pickup: "Your order is packed and waiting for our rider.",
  on_the_way: "Our rider has collected your order and is heading to you now.",
  delivered: "Your order has been delivered. We hope every bite was worth it.",
  cancelled: "Your order has been cancelled. If this was unexpected, please call us and we'll make it right.",
  review_rejected: "Unfortunately the address you gave falls outside the area our riders can reach.",
};

const HOTEL_PHONE = "+233 30 254 4000";

function money(n: unknown) {
  return `GH₵ ${Number(n ?? 0).toFixed(2)}`;
}

function layout(opts: {
  stage: Stage;
  firstName: string;
  reference: string;
  items: any[];
  subtotal: unknown;
  deliveryFee: unknown;
  total: unknown;
  etaLine?: string | null;
  address?: string | null;
  landmark?: string | null;
  riderLine?: string | null;
  trackUrl?: string | null;
  paymentLine?: string | null;
}) {
  const rows = (opts.items ?? [])
    .map(
      (i: any) => `<tr>
        <td style="padding:8px 0;color:#3b3a38;font-size:14px">${i.name} × ${i.quantity}</td>
        <td style="padding:8px 0;text-align:right;color:#3b3a38;font-size:14px">${money(i.line_total_ghs)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:28px 12px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7e2d7">
        <tr><td style="background:${CHARCOAL};padding:24px 28px">
          <p style="margin:0;color:${GOLD};font-size:11px;letter-spacing:3px;text-transform:uppercase">MJ Grand Hotel</p>
          <p style="margin:6px 0 0;color:#f6f4ef;font-size:22px">${HEADLINES[opts.stage]}</p>
        </td></tr>
        <tr><td style="padding:26px 28px">
          <p style="margin:0 0 12px;color:#3b3a38;font-size:15px">Dear ${opts.firstName},</p>
          <p style="margin:0 0 18px;color:#5a5852;font-size:14px;line-height:22px">${INTROS[opts.stage]}</p>

          <div style="border:1px solid ${GOLD}55;background:${GOLD}14;border-radius:10px;padding:12px 16px;margin-bottom:18px">
            <p style="margin:0;color:#8a7320;font-size:10px;letter-spacing:2px;text-transform:uppercase">Reference</p>
            <p style="margin:4px 0 0;color:#8a7320;font-size:18px;letter-spacing:1px">${opts.reference}</p>
          </div>

          ${opts.etaLine ? `<p style="margin:0 0 14px;color:#3b3a38;font-size:14px"><strong>Estimated arrival:</strong> ${opts.etaLine}</p>` : ""}
          ${opts.riderLine ? `<p style="margin:0 0 14px;color:#3b3a38;font-size:14px">${opts.riderLine}</p>` : ""}
          ${opts.address ? `<p style="margin:0 0 14px;color:#3b3a38;font-size:14px"><strong>Delivering to:</strong> ${opts.address}${opts.landmark ? ` (${opts.landmark})` : ""}</p>` : ""}

          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee9dd;margin-top:6px">
            ${rows}
            <tr><td style="padding:8px 0;border-top:1px solid #eee9dd;color:#5a5852;font-size:13px">Subtotal</td>
                <td style="padding:8px 0;border-top:1px solid #eee9dd;text-align:right;color:#5a5852;font-size:13px">${money(opts.subtotal)}</td></tr>
            <tr><td style="padding:4px 0;color:#5a5852;font-size:13px">Delivery</td>
                <td style="padding:4px 0;text-align:right;color:#5a5852;font-size:13px">${money(opts.deliveryFee)}</td></tr>
            <tr><td style="padding:10px 0;color:${CHARCOAL};font-size:15px"><strong>Total</strong></td>
                <td style="padding:10px 0;text-align:right;color:${CHARCOAL};font-size:15px"><strong>${money(opts.total)}</strong></td></tr>
          </table>

          ${opts.paymentLine ? `<p style="margin:14px 0 0;color:#5a5852;font-size:13px">${opts.paymentLine}</p>` : ""}
          ${opts.trackUrl ? `<p style="margin:22px 0 0"><a href="${opts.trackUrl}" style="background:${GOLD};color:${CHARCOAL};text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;display:inline-block">Track your order</a></p>` : ""}

          <p style="margin:24px 0 0;color:#5a5852;font-size:13px;line-height:21px">
            Need us? Call the restaurant on <strong>${HOTEL_PHONE}</strong>.
          </p>
        </td></tr>
        <tr><td style="background:#faf8f3;padding:16px 28px;border-top:1px solid #eee9dd">
          <p style="margin:0;color:#8b877e;font-size:11px">MJ Grand Hotel · No. 460 Abotsi Street, East Legon, Accra, Ghana</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

const STAGE_COLUMN: Partial<Record<Stage, string>> = {
  confirmed: "confirmation_email_sent_at",
  ready_for_pickup: "ready_email_sent_at",
  on_the_way: "dispatch_email_sent_at",
  delivered: "delivered_email_sent_at",
  cancelled: "cancelled_email_sent_at",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const deliveryId = typeof body?.deliveryId === "string" ? body.deliveryId : null;
    const stage = String(body?.stage ?? "") as Stage;
    if (!deliveryId || !(stage in SUBJECTS)) {
      return json({ error: "deliveryId and a valid stage are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const settings = await loadSettings(supabase);
    if (!settings.delivery_emails_enabled) {
      return json({ skipped: true, reason: "Delivery emails disabled" });
    }

    const { data: delivery } = await supabase
      .from("deliveries")
      .select(
        "id, food_order_id, tracking_token, dest_address, dest_landmark, eta_min_minutes, eta_max_minutes, fee_ghs, rider_id, last_customer_email_status",
      )
      .eq("id", deliveryId)
      .maybeSingle();
    if (!delivery) return json({ error: "Delivery not found" }, 404);

    const { data: order } = await supabase
      .from("food_orders")
      .select(
        "id, reference_code, guest_name, email, subtotal_ghs, delivery_fee_ghs, total_ghs, payment_method, payment_status, confirmation_email_sent_at, ready_email_sent_at, dispatch_email_sent_at, delivered_email_sent_at, cancelled_email_sent_at, food_order_items(name, quantity, line_total_ghs)",
      )
      .eq("id", delivery.food_order_id)
      .maybeSingle();
    if (!order) return json({ error: "Order not found" }, 404);
    if (!order.email) return json({ skipped: true, reason: "No email on order" });

    const column = STAGE_COLUMN[stage];
    if (column && (order as any)[column]) {
      return json({ skipped: true, reason: "Already sent for this stage" });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) return json({ skipped: true, reason: "Email is not configured" });

    let riderLine: string | null = null;
    if (delivery.rider_id && (stage === "on_the_way" || stage === "ready_for_pickup")) {
      const { data: rider } = await supabase
        .from("delivery_riders")
        .select("full_name, phone, vehicle_type")
        .eq("id", delivery.rider_id)
        .maybeSingle();
      if (rider) {
        riderLine = `<strong>Your rider:</strong> ${String(rider.full_name).split(" ")[0]} (${rider.vehicle_type}) — ${rider.phone}`;
      }
    }

    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://mjgrandhotelghana.com";
    const trackUrl =
      settings.customer_tracking_enabled && !["delivered", "cancelled", "review_rejected"].includes(stage)
        ? `${siteUrl}/track/${delivery.tracking_token}`
        : null;

    const paymentLine =
      order.payment_status === "paid"
        ? "Payment received — nothing to pay on arrival."
        : `Please have ${money(order.total_ghs)} ready for our rider (cash on delivery).`;

    const html = layout({
      stage,
      firstName: String(order.guest_name).split(" ")[0],
      reference: order.reference_code,
      items: order.food_order_items ?? [],
      subtotal: order.subtotal_ghs,
      deliveryFee: order.delivery_fee_ghs,
      total: order.total_ghs,
      etaLine:
        stage === "confirmed" || stage === "on_the_way"
          ? `${delivery.eta_min_minutes}–${delivery.eta_max_minutes} minutes`
          : null,
      address: delivery.dest_address,
      landmark: delivery.dest_landmark,
      riderLine,
      trackUrl,
      paymentLine: stage === "cancelled" || stage === "review_rejected" ? null : paymentLine,
    });

    const from = Deno.env.get("RESEND_FROM_EMAIL") ??
      "MJ Grand Hotel Restaurant <restaurant@mjgrandhotelghana.com>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [order.email],
        subject: SUBJECTS[stage](order.reference_code),
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend failed", res.status, detail);
      return json({ error: "Email provider rejected the message", status: res.status, details: detail }, 502);
    }

    if (column) {
      await supabase.from("food_orders").update({ [column]: new Date().toISOString() }).eq("id", order.id);
    }
    await supabase.from("deliveries").update({ last_customer_email_status: stage }).eq("id", delivery.id);

    return json({ ok: true, stage });
  } catch (err) {
    console.error("send-delivery-email failed", err);
    return json({ error: "Could not send the notification email." }, 500);
  }
});
