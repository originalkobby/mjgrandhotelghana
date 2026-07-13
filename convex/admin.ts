import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const cancelBooking = mutation({
  args: { bookingId: v.id("bookings"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    await ctx.db.patch(args.bookingId, { status: "cancelled" });
    
    await ctx.db.insert("booking_audit_log", {
      booking_id: args.bookingId,
      old_status: booking.status,
      new_status: "cancelled",
      note: args.reason || "Cancelled by admin",
      changed_at: new Date().toISOString(),
    });
  },
});

export const extendCheckout = mutation({
  args: { bookingId: v.id("bookings"), newCheckOut: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    await ctx.db.patch(args.bookingId, { check_out: args.newCheckOut });
    
    await ctx.db.insert("booking_audit_log", {
      booking_id: args.bookingId,
      old_status: booking.status,
      new_status: booking.status,
      note: `Checkout extended to ${args.newCheckOut}`,
      changed_at: new Date().toISOString(),
    });
  },
});

export const lookupBooking = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("bookings")
      .withIndex("by_reference", q => q.eq("reference_code", args.reference))
      .unique();
  },
});
