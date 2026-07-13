import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logWebhook = mutation({
  args: {
    source: v.string(),
    payload: v.any(),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhook_logs", {
      source: args.source,
      payload: args.payload,
      status: args.status,
      error_message: args.error,
      received_at: new Date().toISOString(),
    });
  },
});

export const syncBooking = mutation({
  args: { payload: v.any() },
  handler: async (ctx, args) => {
    const { payload } = args;
    // Implementation of the OTA normalization and booking logic
    // This would mirror your ota-booking-webhook/index.ts logic
    console.log("Syncing OTA booking:", payload.reference);
  },
});
