import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const OCCUPANCY_TIERS = [
  { threshold: 0.9, factor: 1.35 },
  { threshold: 0.75, factor: 1.2 },
  { threshold: 0.5, factor: 1.05 },
  { threshold: 0.25, factor: 1.0 },
  { threshold: 0.0, factor: 0.9 },
];

const DAY_MULTIPLIERS: Record<number, number> = {
  0: 1.0, 1: 0.95, 2: 0.95, 3: 0.95, 4: 1.0, 5: 1.15, 6: 1.2,
};

export const updateDynamicPricing = mutation({
  args: { daysAhead: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.daysAhead ?? 30;
    const rooms = await ctx.db.query("rooms").filter(q => q.eq(q.field("is_active"), true)).collect();
    
    const now = new Date();
    for (const room of rooms) {
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() + i * 86400000).toISOString().split("T")[0];
        
        // 1. Get current inventory
        const inv = await ctx.db.query("room_inventory")
          .withIndex("by_room_date", q => q.eq("room_id", room._id).eq("date", date))
          .first();
          
        const booked = inv?.booked_count ?? 0;
        const total = inv?.total_count ?? room.total_units;
        const occupancy = total > 0 ? booked / total : 0;
        
        // 2. Calculate factors
        const occFactor = OCCUPANCY_TIERS.find(t => occupancy >= t.threshold)?.factor ?? 1.0;
        const dayFactor = DAY_MULTIPLIERS[new Date(date).getUTCDay()] ?? 1.0;
        
        let rate = room.base_price_ghs * occFactor * dayFactor;
        rate = Math.max(room.base_price_ghs * 0.7, Math.min(room.base_price_ghs * 2.0, rate));
        
        // 3. Upsert
        if (inv) {
          await ctx.db.patch(inv._id, { rate_override: Math.round(rate * 100) / 100 });
        } else {
          await ctx.db.insert("room_inventory", {
            room_id: room._id,
            date,
            total_count: total,
            booked_count: booked,
            rate_override: Math.round(rate * 100) / 100,
            is_closed: false,
            min_stay: 1,
          });
        }
      }
    }
  }
});
