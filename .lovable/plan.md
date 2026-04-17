
The user wants the admin Bookings page (`/admin/bookings`) to be fully bidirectionally synced with the Inventory page (`/admin/inventory`), so that any booking lifecycle action (create, status change, check-in, check-out, cancellation, no-show) immediately and correctly reflects in `room_inventory.booked_count`, and the Inventory grid stays accurate.

## Current state audit

**What works:**
- `create-booking` edge function increments `booked_count` per night.
- `auto-status` edge function releases inventory on completed/no-show via `releaseInventoryForBooking`.
- `cancel-booking` edge function releases inventory on guest-side cancellation.
- `extend-checkout` edge function increments inventory for added nights.
- DB triggers sync `total_units` → `total_count` and `base_price_ghs` → clear `rate_override`.

**Gaps in `src/pages/admin/Bookings.tsx`:**
1. **Status changes are NOT inventory-aware.** `handleStatusUpdate` only decrements inventory when status moves to `cancelled`. It does NOT release inventory for `no_show` or `completed`. It does NOT re-book inventory if an admin reverses a cancellation back to `confirmed`. It does NOT adjust inventory if `check_in`/`check_out` dates change.
2. **No inventory cache invalidation.** After a status update or payment, only `["admin-bookings"]` is invalidated. The Inventory grid (`["admin-inventory"]`) keeps showing stale `booked_count` until a manual refresh.
3. **Check-in/check-out timestamps** (recorded from the Guests page) don't trigger inventory recheck. While `actual_check_in/out` is metadata-only and shouldn't change `booked_count`, an early checkout should optionally release the remaining nights — currently nothing does that.
4. **No lifecycle sync hook** on the Bookings page. Overview uses `useBookingLifecycleSync` to auto-run `auto-status` every 30s; Bookings doesn't, so expired bookings keep blocking inventory until someone visits Overview.
5. **Date edits not supported.** There's no UI to edit `check_in`/`check_out` of an existing booking, but if status changes to cancelled, the release loop does run — however it doesn't write an audit-log style note and may double-decrement if the booking was already cancelled.

## The fix

### 1. Centralize inventory mutations in a shared helper
Create `src/lib/inventorySync.ts` exporting:
- `releaseInventory(bookingId)` — decrements `booked_count` for each night between `check_in` and `check_out`, clamped at 0.
- `reserveInventory(bookingId)` — increments `booked_count` for each night (used when reversing a cancellation).

Both read the booking, iterate dates, and update `room_inventory` rows. Reused by Bookings UI and any future surface.

### 2. Make `handleStatusUpdate` fully lifecycle-aware
In `src/pages/admin/Bookings.tsx`, expand the status transition logic:

| Old status | New status | Inventory action |
|---|---|---|
| confirmed/pending | cancelled | release |
| confirmed/pending | no_show | release |
| confirmed/pending | completed | release (room is free again) |
| cancelled/no_show | confirmed | reserve (re-book) |
| confirmed | confirmed (no change) | none |

Apply the action via the helper, then write a descriptive audit-log note (e.g., "Released 3 nights of inventory") and invalidate both `["admin-bookings"]` and `["admin-inventory"]`.

### 3. Invalidate inventory on every booking write
After `handleStatusUpdate`, `handleRecordPayment`, and the room assignment flow, call:
```
queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
```

### 4. Wire `useBookingLifecycleSync` into Bookings page
Add the same 30-second poll the Overview uses, with `onSynced` invalidating `["admin-bookings"]` and `["admin-inventory"]`. Expired bookings auto-flip to completed/no-show and inventory releases without anyone visiting Overview.

### 5. Optional early-checkout release (Guests page)
When a front-desk user records `actual_check_out` earlier than the scheduled `check_out`, prompt: "Release remaining N nights to inventory?" If yes, update `bookings.check_out` to today and call `releaseInventory` for the freed nights, plus audit log.

### 6. Realtime channel (lightweight)
Subscribe Inventory page to Supabase Realtime on `room_inventory` changes (already pattern-friendly since RLS allows public select). When any row changes, refetch. This guarantees cross-tab sync without polling.

```text
Bookings UI ──status change──▶ inventorySync helper ──update room_inventory──▶ Realtime
                                       │                                          │
                                       ▼                                          ▼
                              audit log entry                          Inventory grid refetch
```

## Files touched
- `src/lib/inventorySync.ts` — new shared helper
- `src/pages/admin/Bookings.tsx` — expanded status logic, invalidations, lifecycle sync hook
- `src/pages/admin/Inventory.tsx` — Realtime subscription on `room_inventory`
- `src/pages/admin/Guests.tsx` — early-checkout prompt (optional, can defer)

No DB schema changes. No edge function changes (existing `auto-status`, `cancel-booking`, `extend-checkout` already do the right thing).

## Result
Every booking action in the admin dashboard — manual status change, payment, auto-expiry, cancellation, extension — instantly and correctly updates `room_inventory`, and the Inventory grid reflects it within seconds via Realtime. No more stale `booked_count` and no more drift between the two pages.
