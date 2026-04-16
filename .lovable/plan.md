

## Plan: Pre-select Room from "Book Now" Button

### What Changes

1. **RoomsPreview.tsx** — Change the `<a href="/booking">` to a `<Link>` (or `<a>`) that passes the room's `id` and `slug` as a URL query parameter, e.g. `/booking?room=<room-id>`.

2. **Booking.tsx** — On mount, read the `room` query param. If present:
   - Fetch that room's details from Supabase (name, price, images, amenities, etc.)
   - Store it in booking state via `setSelectedRoom()`
   - Set a flag (e.g. `roomPreselected`) so the flow knows to skip the "rooms" step

3. **useBooking.ts** — Add a small enhancement:
   - Accept an optional `skipRoom` flag or expose a `setRoomPreselected` setter
   - Modify `goNext` so that when stepping from "search", if a room is already selected, it jumps to "addons" instead of "rooms"
   - Modify `goBack` similarly so that going back from "addons" returns to "search" (not "rooms") when the room was pre-selected

4. **BookingStepper.tsx** — Optionally hide or grey out the "Room" step dot when pre-selected, so the stepper shows: Dates → Extras → Details → Payment → Confirm.

### Flow Summary

```text
Current:      Search → Room → Extras → Details → Payment → Confirm
Pre-selected: Search → [skip] → Extras → Details → Payment → Confirm
```

The existing flow (without a query param) remains completely unchanged.

### Technical Details

- **Query param**: `/booking?room=<uuid>` — parsed via `useSearchParams`
- **Room fetch**: Single Supabase query on the `rooms` table by ID, computing `nightlyRate` and `totalPrice` once dates are set (deferred to after search step)
- **Step skipping logic**: A boolean `roomPreselected` in `BookingState` controls whether `goNext`/`goBack` skip index 1 ("rooms")
- **Price computation**: Since dates aren't known until after the search step, the room's `totalPrice` will be computed when the user completes the search step (using the same inventory/rate logic as `RoomSelectionStep`)
- **Stepper**: Filter the visible steps array when `roomPreselected` is true

### Files Modified

| File | Change |
|------|--------|
| `src/components/RoomsPreview.tsx` | Link to `/booking?room={id}` |
| `src/hooks/useBooking.ts` | Add `roomPreselected` flag; adjust `goNext`/`goBack` to skip "rooms" step |
| `src/pages/Booking.tsx` | Read `room` query param; fetch room data; set pre-selected state; compute price after dates are chosen |
| `src/components/booking/BookingStepper.tsx` | Hide "Room" step when pre-selected |

