# Automatic rider dispatch engine

The specification describes a dispatch workflow. Checking it against the live system, almost everything is already built: order placing, restaurant statuses, rider assignment, pickup, on-the-way, live GPS to the customer map, delivered, and the rider earnings ledger separate from customer payments.

**One part of the specification is missing: the dispatch engine itself.** Today a manager must pick a rider by hand. There is no automatic offer, no rider "reject", no cascade to the next rider, and no "Rider Required" alert. (The "auto-assign riders" switch exists in settings but nothing uses it.)

## What gets built

### 1. Automatic offer when food is Ready for Pickup
When staff mark an order **Ready for Pickup**, the system picks the best rider automatically:
- must be signed in, active and not already on a job
- nearest to the hotel first (using their last known position)
- fewest open jobs as a tie-breaker

The chosen rider gets an offer, not an assignment.

### 2. Rider accepts or declines
The rider portal shows a new **offer card**: order reference, pickup, destination, distance, estimated earning, and a countdown.
- **Accept** — the rider is assigned, the delivery moves to Rider Assigned, the customer sees "Rider assigned".
- **Decline** — the offer is recorded and passed to the next best rider immediately.
- **No response before the countdown ends** — treated as a decline and passed on automatically.

### 3. Cascade and fallback
The engine works down the ranked rider list. If every rider declines or none is available, the delivery is flagged **Rider Required** and appears highlighted at the top of the Deliveries board so an operations manager can assign someone by hand. Manual assignment always overrides the engine.

### 4. Controls and visibility
- Deliveries → Settings: turn auto-dispatch on/off, set the offer countdown (seconds) and how many riders to try before flagging.
- Deliveries board: a "Rider Required" banner/filter, and per-delivery history of who was offered the job, who declined, and when.
- Riders tab: each rider shows Available / On a job / Offline plus their last seen position time.

Everything is logged to the existing audit trail.

## Technical details

**Database (one migration):**
- `delivery_offers` — delivery_id, rider_id, offered_at, expires_at, status enum (`offered`/`accepted`/`declined`/`expired`/`superseded`), decline_reason, attempt number. Unique on (delivery_id, rider_id, attempt). GRANTs + RLS: riders read only their own offers; ops/staff read all; writes service-role only.
- `deliveries`: add `dispatch_state` (`idle`/`offering`/`assigned`/`needs_rider`), `dispatch_attempts`.
- `delivery_settings`: add `offer_timeout_seconds` (default 60), `max_dispatch_attempts` (default 3); reuse `auto_assign_riders`.
- Add `delivery_offers` to the realtime publication.

**Edge function `dispatch-rider`** (service role, idempotent per delivery+attempt):
- `dispatch` — rank candidates (Haversine from hotel origin to `delivery_riders.last_lat/lng`, riders with no fix ranked last; exclude `busy`/inactive/already-offered), create the next offer, write status history + audit.
- `respond` — rider accept/decline, verified against the rider's own session and offer ownership; accept assigns the rider and sets the delivery to `rider_assigned`; decline triggers the next attempt.
- `sweep` — expire stale offers and re-dispatch; called by a `pg_cron` job every minute so nothing stalls if a rider's phone goes offline, plus opportunistically when the board loads.
- Rate-limited and role-gated using the existing `_shared/delivery.ts` helpers.

**Hooks into existing code:**
- `delivery-action`: on transition to `ready_for_pickup`, call `dispatch-rider` when `auto_assign_riders` is on; on manual `assign_rider`, supersede any open offer.
- `supabase/config.toml`: `[functions.dispatch-rider] verify_jwt = false`.

**Frontend:**
- `src/pages/RiderPortal.tsx` — offer card with countdown, Accept/Decline, realtime subscription to own offers.
- `src/pages/admin/Deliveries.tsx` — Rider Required highlighting + offer history on the row.
- `src/components/admin/DeliverySettingsPanel.tsx` — auto-dispatch controls.

**Tests:** ranking (nearest/available/workload), decline cascade, expiry sweep, all-declined → `needs_rider`, and idempotency so one delivery can never produce two accepted offers.

## Still outside the app (unchanged)
Paystack secret key for online food payment, and Google billing + Places/Routes APIs for address search and real driving distance.
