import { cronJobs } from "convex/server";
import { api } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const autoUpdateBookingStatuses = internalMutation({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const expired = await ctx.db.query("bookings")
      .filter(q => q.and(
        q.or(q.eq(q.field("status"), "confirmed"), q.eq(q.field("status"), "pending")),
        q.lte(q.field("check_out"), today)
      ))
      .collect();

    for (const booking of expired) {
      const newStatus = booking.payment_status === "paid" ? "completed" : "no_show";
      await ctx.db.patch(booking._id, { status: newStatus });
      
      // Audit log
      await ctx.db.insert("booking_audit_log", {
        booking_id: booking._id,
        old_status: booking.status,
        new_status: newStatus,
        note: `Auto-status: check-out date reached.`,
        changed_at: new Date().toISOString(),
      });
    }
  }
});

const crons = cronJobs();

// Run daily at 1 AM
crons.daily(
  "auto-status-update",
  { hourUTC: 1, minuteUTC: 0 },
  api.crons.autoUpdateBookingStatuses
);

// Run dynamic pricing update every 6 hours
crons.interval(
  "dynamic-pricing-update",
  { hours: 6 },
  api.pricing.updateDynamicPricing,
  { daysAhead: 30 }
);

export default crons;
