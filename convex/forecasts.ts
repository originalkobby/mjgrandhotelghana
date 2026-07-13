import { mutation, action } from "./_generated/server";
import { v } from "convex/values";

export const ingestForecast = mutation({
  args: {
    room_id: v.string(),
    forecast_date: v.string(),
    predicted_occupancy: v.number(),
    suggested_rate: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("revenue_forecasts", {
      room_id: args.room_id,
      forecast_date: args.forecast_date,
      expected_occupancy: args.predicted_occupancy,
      predicted_revenue: args.suggested_rate * args.predicted_occupancy,
      recommended_price: args.suggested_rate,
      created_at: new Date().toISOString(),
    });
  },
});
