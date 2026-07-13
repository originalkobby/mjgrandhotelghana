import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const recordPayment = mutation({
  args: {
    bookingId: v.string(),
    amount: v.number(),
    reference: v.string(),
    status: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const { bookingId, amount, reference, status, metadata } = args;

    // 1. Log payment
    await ctx.db.insert("payment_logs", {
      booking_id: bookingId,
      amount_ghs: amount,
      currency: "GHS",
      provider: "paystack",
      provider_reference: reference,
      status: status,
      metadata: metadata,
      created_at: new Date().toISOString(),
    });

    // 2. Update booking status if successful
    if (status === "success") {
      await ctx.db.patch(bookingId as any, {
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      });
    }
  },
});
