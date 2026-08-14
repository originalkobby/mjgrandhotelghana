# Group / bulk room booking

Let a guest book several rooms — across different room types — in a single flow, with one guest record, one payment and one shared group reference.

## Guest experience

1. **Search step**: add a "Group booking" toggle. When on, the guest enters total guests and the flow switches to multi-room selection.
2. **Room selection**: each room card gets a quantity stepper (0 up to the number of units actually available for every night of the stay). The guest can mix room types, e.g. 3 Deluxe + 2 Suites. A running summary shows rooms selected, total nights and running total. Cap: 20 rooms per group booking.
3. **Add-ons**: unchanged — add-ons are chosen once and attached to the first (lead) room booking, with quantity still editable.
4. **Guest details**: one lead guest (name, email, phone, requests). No per-room occupant names.
5. **Payment**: one payment for the group total; Paystack initialised for the combined amount. Pay-at-hotel works the same.
6. **Confirmation**: shows the **group reference** plus the list of individual room references, and the PDF/ICS include every room in the group.

Pricing stays on standard nightly rates, and existing promo codes (including group flat nightly rates) apply to the whole group total.

## Records and inventory

- One `bookings` row is created per room unit, all sharing a `group_ref`.
- Each row holds one unit of inventory for the whole stay, so availability, the Inventory grid, the Bookings table and the Checked-In logic all keep working unchanged.
- Admin Bookings table shows a group badge on grouped rows and lets staff filter/search by group reference; status and date edits still act per row.
- Cancellation via booking lookup cancels the individual room; cancelling from admin can be done per row.

## Technical notes

- **Migration**: add `group_ref text` and `group_size integer` to `public.bookings`, plus an index on `group_ref`. No new table.
- **`supabase/functions/create-booking`**: accept an optional `rooms: [{ roomId, quantity }]` array alongside the existing single-room payload (backwards compatible). Server-side it re-validates availability per room per night, computes each row's base total from DB rates, generates one `group_ref`, splits the promo discount proportionally across rows, creates the guest once, inserts all booking rows, increments `room_inventory.booked_count` per room per night, and returns `{ groupRef, bookings: [...] , total }`. Availability re-checks run before any insert so a partially available group fails cleanly with a 409.
- **Rate limiting**: the existing 3-per-hour-per-email limit counts a group as one request.
- **`supabase/functions/paystack`**: initialise/verify against the group total; verification marks every booking in the group paid.
- **`src/hooks/useBooking.ts`**: replace `selectedRoom` usage with an additional `selectedRooms: Array<SelectedRoom & { quantity: number }>` plus an `isGroup` flag; single-room mode keeps its current shape so existing steps stay simple.
- **UI**: `SearchStep` (toggle), `RoomSelectionStep` (quantity steppers + availability cap), `PaymentStep` and `ConfirmationStep` (group totals, reference list), `BookingStepper` unchanged.
- **`src/lib/bookingLookup.ts` / lookup UI**: looking up a group reference returns all rooms in that group.
- **Convex dual-write**: include `groupRef` in the synced payload for each booking.
