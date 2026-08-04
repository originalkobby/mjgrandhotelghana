# Supabase → Convex + Vercel Migration Status

Decisions locked: **Clerk** auth, **Convex File Storage**, **hard cutover**.

## Progress

- [x] Phase 1 — Install `convex`, `@clerk/clerk-react`
- [x] Phase 2 — Full Convex schema (`convex/schema.ts`), auth helpers (`convex/lib/auth.ts`, `convex/auth.config.ts`)
- [ ] Phase 3 — Port edge functions to Convex mutations/actions/httpActions
  - [ ] `create-booking` → mutation w/ rate limit table
  - [ ] `paystack` init + verify → httpAction
  - [ ] `ota-booking-webhook` → httpAction w/ HMAC
  - [ ] `auto-status` → Convex cron (hourly)
  - [ ] `cancel-booking`, `extend-checkout` → mutations
  - [ ] `mj-ai-chat` → action (Lovable AI Gateway)
  - [ ] `send-*` email → actions (Resend)
- [ ] Phase 4 — Frontend swap
  - [ ] Add `<ClerkProvider>` + `<ConvexProviderWithClerk>` in `src/main.tsx`
  - [ ] Replace `src/integrations/supabase/*` calls in `src/pages/**` and `src/components/**` with `useQuery`/`useMutation`
  - [ ] Replace `useAdminAuth` with Clerk `useUser` + role query
  - [ ] Remove Supabase realtime `channel()` subscriptions (Convex queries are live)
- [ ] Phase 5 — Data migration
  - [ ] Dump each Supabase table to JSON
  - [ ] Import via one-shot `internalMutation`
  - [ ] Re-upload `hotel-uploads` bucket to Convex File Storage, rewrite URLs
- [ ] Phase 6 — Cutover
  - [ ] Freeze Supabase writes
  - [ ] Final delta import
  - [ ] DNS flip to Vercel
  - [ ] Update Paystack + OTA webhook URLs
  - [ ] 48h monitor, archive Supabase

## Required from user before Phase 3–4

1. Create Convex project → run `bunx convex dev` locally once, paste `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` (we'll use `VITE_CONVEX_URL`).
2. Create Clerk app → paste `VITE_CLERK_PUBLISHABLE_KEY`; add JWT template named `convex` and paste its issuer domain into Convex env as `CLERK_JWT_ISSUER_DOMAIN`.
3. Create Vercel project pointing at this repo (post cutover).

## Notes

- `roomNumbers` on `rooms` is admin-only — enforce in every query that returns rooms.
- Rate limiting moved from Postgres to `rateLimits` table (key + rolling window).
- `syncToConvex` shim in Supabase edge functions becomes obsolete after Phase 6.
