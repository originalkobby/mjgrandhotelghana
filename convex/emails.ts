import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const sendCancellationEmail = action({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const booking = await ctx.runQuery(api.bookings.getBookingDetails, { id: args.bookingId });
    if (!booking) throw new Error("Booking not found");

    const guest = await ctx.runQuery(api.guests.getGuest, { id: booking.guest_id });
    if (!guest?.email) throw new Error("Guest email not found");

    const room = await ctx.runQuery(api.rooms.getRoom, { id: booking.room_id });

    const checkIn = new Date(booking.check_in).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const checkOut = new Date(booking.check_out).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const total = Number(booking.final_total_ghs).toLocaleString();

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>Booking Cancelled</h2>
        <p>Hi ${guest.full_name}, your reservation ${booking.reference_code} has been cancelled.</p>
        <p><strong>Dates:</strong> ${checkIn} - ${checkOut}</p>
        <p><strong>Total:</strong> GH₵ ${total}</p>
      </body>
      </html>
    `;

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

    return await res.json();
  },
});
