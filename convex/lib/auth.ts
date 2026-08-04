import { QueryCtx, MutationCtx } from "../_generated/server";

export type AppRole = "admin" | "revenue_manager" | "front_desk" | "finance";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity;
}

export async function hasRole(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string,
  role: AppRole,
): Promise<boolean> {
  const row = await ctx.db
    .query("userRoles")
    .withIndex("by_user_role", (q) =>
      q.eq("clerkUserId", clerkUserId).eq("role", role),
    )
    .first();
  return row !== null;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  role: AppRole,
) {
  const identity = await requireUser(ctx);
  const ok = await hasRole(ctx, identity.subject, role);
  if (!ok) throw new Error(`Forbidden: requires ${role}`);
  return identity;
}

export async function requireAnyRole(
  ctx: QueryCtx | MutationCtx,
  roles: AppRole[],
) {
  const identity = await requireUser(ctx);
  for (const r of roles) {
    if (await hasRole(ctx, identity.subject, r)) return identity;
  }
  throw new Error(`Forbidden: requires one of ${roles.join(", ")}`);
}
