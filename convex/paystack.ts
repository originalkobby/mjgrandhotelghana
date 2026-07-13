import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const initialize = action({
  args: {
    email: v.string(),
    bookingReference: v.string(),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) throw new Error("Paystack secret key not configured");

    // 1. Get booking info via query
    const booking = await ctx.runQuery(api.bookings.getBookingByReference, {
      reference: args.bookingReference,
    });

    if (!booking) throw new Error("Booking not found");
    if (booking.payment_status === "paid") throw new Error("Booking already paid");

    // 2. Initialize Paystack
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: args.email,
        amount: Math.round(booking.final_total_ghs * 100),
        currency: "GHS",
        reference: args.bookingReference,
        callback_url: args.callbackUrl,
        metadata: { booking_id: booking._id },
      }),
    });

    const data = await res.json();
    if (!data.status) throw new Error(data.message);

    return data.data;
  },
});

export const verify = action({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) throw new Error("Paystack secret key not configured");

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(args.reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });

    const data = await res.json();
    if (!data.status) throw new Error(data.message);

    const txn = data.data;
    const isPaid = txn.status === "success";

    // Update DB via mutation
    await ctx.runMutation(api.payments.recordPayment, {
      bookingId: txn.metadata.booking_id,
      amount: txn.amount / 100,
      reference: txn.reference,
      status: txn.status,
      metadata: txn,
    });

    return { verified: isPaid, status: txn.status };
  },
});
