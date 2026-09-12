# Fix rider distance source & surface it in the admin UI

## Problem
The dispatch engine ranks riders by Haversine distance from the hotel to `delivery_riders.last_lat/last_lng`, but nothing ever writes those columns — the rider portal only inserts into the `rider_locations` history table and there is no trigger syncing the latest ping into `delivery_riders`. So in production every rider's position is NULL, distance is never real, and `rankRiders()` silently falls back to workload-then-id order. The admin "Assign a rider" dropdown also shows only `Name — status`, with no distance.

## Goal
Make rider distance real (so the nearest free rider actually wins automatic dispatch) and show each rider's live distance + last-seen time in the admin views.

## Changes

### 1. Database — sync rider pings into `delivery_riders`
A `SECURITY DEFINER` trigger function `sync_rider_location()` that fires `AFTER INSERT ON rider_locations` and copies `NEW.lat / NEW.lng / NEW.recorded_at` into `delivery_riders.last_lat / last_lng / last_location_at` for the matching rider. This is a pure schema change via the migration tool. No new grants needed (trigger runs as definer; `rider_locations` already grants `INSERT` to authenticated and `ALL` to service_role).

### 2. Rider portal — ping position while signed in, not only mid-run
`src/pages/RiderPortal.tsx` currently only starts `geolocation.watchPosition` when an active job exists. Add a second, throttled watch that runs whenever a rider is signed in (idle or busy) and inserts a `rider_locations` row at most every ~30 s, so idle riders carry a real position for the next dispatch. Keep the existing active-run watch (higher frequency) unchanged. The new trigger above keeps `delivery_riders` current from these pings.

### 3. Shared client-side Haversine helper
`src/lib/distance.ts` exporting `haversineKm(aLat, aLng, bLat, bLng)` (mirrors `_shared/dispatch.ts`) and a `formatDistance(km)` formatter, so the admin UI shows the same distances the engine ranks by.

### 4. Admin delivery board — show distance in the assign dropdown
`src/pages/admin/Deliveries.tsx`:
- Extend the `Rider` select to include `last_lat, last_lng`.
- Extend the `Row` select to include `origin_lat, origin_lng` (the hotel pickup point for that delivery).
- In the "Assign a rider" `<SelectItem>`, render `{full_name} — {status} · {x} km` using the shared Haversine helper; show "— · location unknown" when the rider has no position.

### 5. Admin Riders panel — show distance from hotel + last seen
`src/components/admin/RidersPanel.tsx`:
- Fetch `delivery_settings` (origin_lat/origin_lng = the hotel) once.
- Extend the rider select to include `last_lat, last_lng, last_location_at`.
- On each rider card, show `{x} km from hotel · last seen {relative time}` (or "No location yet") beneath the status badge.

## Verification
- `npx tsgo --noEmit -p tsconfig.app.json` passes.
- Vitest dispatch tests still pass (`bunx vitest run src/test/dispatch.test.ts`).
- Manual: with a rider signed in on the rider portal, confirm `delivery_riders.last_lat/last_lng` populate (query the table), the admin assign dropdown shows a real km value, and the Riders panel shows distance + last-seen.
