# Add "Checked-In" booking status

Add a new `Checked-In` status to bookings that sits between Confirmed and Checked-out, and make it hold the room's inventory for the guest's whole stay.

## Behaviour

- New status option `Checked-In`, selectable in the booking edit panel on the admin Bookings page alongside pending, confirmed, cancelled, checked-out (completed) and no-show.
- A checked-in booking occupies the room: one unit of that room type is held for every night from check-in to check-out.
  - Nights are already held while a booking is pending or confirmed, so moving Confirmed → Checked-In keeps the same hold (no double-deduction).
  - Moving a released booking (cancelled / no-show / checked-out) → Checked-In re-reserves the nights.
  - Moving Checked-In → cancelled / no-show / checked-out releases the nights back to availability.
- Availability counts used by the public booking search, the Inventory grid and dynamic pricing will treat Checked-In the same as pending/confirmed (room is unavailable).
- Automatic end-of-stay processing (checkout date reached) also applies to checked-in bookings: paid → Checked-out, unpaid → No-show, with nights released either way.
- Status badge styling: a distinct colour for Checked-In, in line with the existing badge palette.

## Technical notes

- Migration: add `checked_in` to the `booking_status` enum.
- `src/lib/inventorySync.ts`: add `checked_in` to the `ACTIVE` set so `getInventoryAction` reserves/releases correctly on transitions.
- `src/lib/bookingLifecycle.ts`: include `checked_in` in `ACTIVE_STATUSES` so payment/status display and auto-derived end-of-stay status behave as they do for confirmed.
- `src/pages/admin/Bookings.tsx`: add to `STATUS_OPTIONS`, `STATUS_LABELS` ("checked-in"), `STATUS_COLORS`; existing date-edit release/reserve logic extended to count `checked_in` as active.
- Occupancy/availability queries filtering `["pending","confirmed"]` updated to include `checked_in`: `src/pages/admin/Inventory.tsx`, `supabase/functions/dynamic-pricing`, `supabase/functions/create-booking` and `extend-checkout` availability checks, `supabase/functions/auto-status`.
- `src/pages/admin/Overview.tsx` and `src/pages/admin/Guests.tsx` status colour maps / active-booking checks updated to recognise the new value.
- `convex/schema.ts` booking status union extended with `checked_in` so dual-writes validate.
