# Migration Plan: Supabase → Convex + Vercel

Move MJ Grand Hotel from Supabase (DB, Auth, Storage, Edge Functions) to Convex (DB, functions, real-time) with Vercel hosting the frontend. Keep Paystack, Resend, Lovable AI Gateway, and OTA webhooks intact.

## Phase 1 — Foundations (no user impact)

1. **Create Convex project** and wire `convex/` directory into the repo (already partially present via `CONVEX_SYNC_URL`).
2. **Choose auth provider**: Clerk (recommended — first-class Convex integration, magic link + OAuth) OR Convex Auth (native, simpler, fewer providers). Decision needed before Phase 3.
3. **Choose storage**: Convex File Storage (simplest) OR keep Supabase Storage temporarily (only `hotel-uploads` bucket, public assets).
4. **Environment**: add Convex deployment URL + admin key to Vercel; keep Supabase env vars during dual-run.

## Phase 2 — Schema port

Translate every Supabase table to a Convex table in `convex/schema.ts`. Tables to port:

- Core: `rooms`, `room_inventory`, `bookings`, `booking_add_ons`, `add_ons`, `guests`, `promotions`, `seasonal_pricing`, `cancellation_policies`
- Ops: `booking_audit_log`, `payment_logs`, `webhook_logs`, `demand_alerts`, `revenue_forecasts`, `revenue_streams`
- Content: `gallery_images`, `menu_items`, `contact_messages`, `support_tickets`, `conversations`
- Auth-adjacent: `profiles`, `user_roles`

Convex differences to handle:
- No RLS → enforce access in every query/mutation via `ctx.auth` + role checks (port `has_role` to a Convex helper).
- No SQL triggers → replace `sync_inventory_*`, `handle_new_user`, `generate_booking_ref` with Convex mutations/scheduled functions.
- Indexes: add Convex indexes for every current query pattern (bookings by date, room_id, status, guest email; inventory by room+date; etc.).

## Phase 3 — Function port

Rewrite each Supabase Edge Function as a Convex action or HTTP action:

| Supabase function | Convex equivalent |
|---|---|
| `create-booking` | `mutation` (with rate-limit table) |
| `paystack` init/verify | `httpAction` (webhook + init) |
| `ota-booking-webhook` | `httpAction` with HMAC verify |
| `auto-status` (hourly cron) | Convex `cron` |
| `cancel-booking`, `extend-checkout` | `mutation` |
| `mj-ai-chat`, AI concierge | `action` calling Lovable AI Gateway |
| `send-*` email | `action` calling Resend |

Rate-limiting (bookings 3/hr) → Convex table `rate_limits` keyed by IP/email.

## Phase 4 — Frontend swap

- Replace `@supabase/supabase-js` calls in `src/` with `convex/react` hooks (`useQuery`, `useMutation`, `useAction`).
- Swap `useEffect + supabase.channel` real-time with Convex reactive queries (free — every `useQuery` is live).
- Replace `useAdminAuth` with Clerk/Convex Auth session hook + role check.
- Update `src/integrations/supabase/*` → `src/integrations/convex/*`.

## Phase 5 — Data migration

- Export each Supabase table via `supabase--read_query` → JSON.
- Write a one-shot Convex `internalMutation` seeder to import JSON dumps.
- Migrate Storage: download `hotel-uploads` objects, re-upload to Convex storage, rewrite URLs in `rooms`, `gallery_images`, `menu_items`.
- Verify counts + spot-check bookings, revenue totals, inventory.

## Phase 6 — Cutover

1. Freeze writes on Supabase (put admin in read-only mode).
2. Run final delta import.
3. Point custom domains (`mjgrandhotelghana.com`) DNS to Vercel.
4. Update Paystack + OTA webhook URLs to new Convex HTTP endpoints.
5. Monitor logs for 48h; keep Supabase project as read-only backup for 30 days, then archive.

## Technical notes

- **Cost**: Convex free tier covers small hotels; check function-call volume against Convex pricing before commit.
- **Loss of features to replace manually**: Postgres full-text search (use Convex search indexes), SQL views (materialize in queries), event triggers.
- **AI concierge** knowledge base and MJ shared secret stay unchanged — only the runtime host changes.
- **Estimated effort**: schema + functions ~1 week, frontend refactor ~1 week, data migration + cutover ~2–3 days.

## Open questions before I start

1. Clerk or Convex Auth?
2. Convex File Storage or keep Supabase Storage?
3. Cutover style: hard cutover (single downtime window) or dual-write for a week then switch?
