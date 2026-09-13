# Where the customer sees rider status — and a live ETA

## Where it appears today

Everything the customer sees lives on their personal tracking page, opened with the "Track your order" link shown right after checkout and repeated in the delivery emails. No login is needed; the link is unguessable.

On that page:
- **Rider assigned** — the Status line at the top of the order card changes to "Rider assigned" the moment a rider accepts.
- **On the way** — the timeline advances to "On the way", the rider's first name and phone number appear beneath the map, and a gold dot shows the rider's approximate position, refreshing on its own.

## The one gap

The page currently shows an arrival *range* measured from order confirmation (for example "25–35 minutes"), not a live countdown. It does not shrink as the rider gets closer.

## What gets built

A live ETA on the tracking page:
- Before a rider picks up: keep showing the estimated range as today.
- Once the rider has picked up and is on the way: show a single "Arriving in about N minutes", recalculated on every refresh from the rider's current position to the customer's address.
- If the rider's position is stale or unknown, fall back to the existing range rather than showing a wrong number.
- Small "updated just now / X min ago" note so the customer knows the figure is fresh.

## Technical details

- `supabase/functions/track-order/index.ts`: when the delivery is in a live status and a recent `rider_locations` fix exists, compute remaining distance (Haversine, same helper the dispatch engine uses) and convert to minutes using the delivery's own implied average speed (`distance_km` / `travel_minutes`), floored at a sane minimum speed, plus the settings `eta_buffer_minutes`. Return `live_eta_minutes` and `rider_location.recorded_at`; return `null` when the fix is older than a few minutes.
- `src/pages/OrderTracking.tsx`: render `live_eta_minutes` in place of the range when present, otherwise the existing range; show the last-updated note. Polling interval is unchanged, so no extra function invocations.
- Reuse `src/lib/distance.ts` rather than duplicating the maths.
- Test: ETA calculation helper (near/far/stale-fix/no-fix cases).
