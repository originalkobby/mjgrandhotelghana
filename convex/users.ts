import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMyRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Look up the user in our native 'user_roles' table
    // We use the 'subject' from Clerk as our user_id
    const userRole = await ctx.db
      .query("user_roles")
      .filter((q) => q.eq(q.field("user_id"), identity.subject))
      .first();

    return userRole?.role ?? null;
  },
});
