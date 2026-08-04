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

    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "bookingId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("reference_code, check_in, check_out, adults, children, final_total_ghs, rooms(name), guests(full_name, email)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    const guest = booking.guests as { full_name: string; email: string } | null;
    if (!guest?.email) {
      return new Response(
        JSON.stringify({ error: "No guest email on file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const room = booking.rooms as { name: string } | null;
    const checkIn = new Date(booking.check_in).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const checkOut = new Date(booking.check_out).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const total = Number(booking.final_total_ghs).toLocaleString();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#d4a574;font-size:24px;font-weight:normal;letter-spacing:2px;">MAISON JELATO</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;">Booking Cancelled</h2>
          <p style="margin:0 0 24px;color:#666;font-size:14px;font-family:Arial,sans-serif;">
            Hi ${guest.full_name}, your reservation has been cancelled as requested.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;border-radius:6px;padding:20px;margin-bottom:24px;">
            <tr><td>
              <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Reference</p>
              <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;font-family:monospace;font-weight:bold;">${booking.reference_code}</p>
              ${room ? `<p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Room</p><p style="margin:0 0 16px;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">${room.name}</p>` : ""}
              <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Dates</p>
              <p style="margin:0 0 16px;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">${checkIn} → ${checkOut}</p>
              <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Total</p>
              <p style="margin:0;color:#1a1a1a;font-size:14px;font-family:Arial,sans-serif;">GH₵ ${total}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#666;font-size:14px;font-family:Arial,sans-serif;">
            If you paid online, a refund will be processed within 5–7 business days.
          </p>
          <p style="margin:0;color:#666;font-size:14px;font-family:Arial,sans-serif;">
            Questions? Reply to this email or call us at +233 XX XXX XXXX.
          </p>
        </td></tr>
        <tr><td style="background:#1a1a1a;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#888;font-size:12px;font-family:Arial,sans-serif;">
            Maison Jelato · Accra, Ghana
          </p>
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
        from: "Maison Jelato <onboarding@resend.dev>",
        to: [guest.email],
        subject: `Booking ${booking.reference_code} Cancelled`,
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
    console.error("send-cancellation-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
