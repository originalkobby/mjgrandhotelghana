import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRoomById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id as any);
  },
});

export const listActiveRooms = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});
