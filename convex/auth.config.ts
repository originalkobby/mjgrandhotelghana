/**
 * Clerk → Convex auth bridge.
 * Set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard (Settings → Environment Variables)
 * to your Clerk instance issuer, e.g. https://your-app.clerk.accounts.dev
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
