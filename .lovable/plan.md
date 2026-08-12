# Room Price / Rate Editing on Dashboard

## Goal
Allow hotel staff to edit room prices and rates directly from the admin dashboard in a fast, role-gated way.

## Background
- **Room base prices** are currently managed only on the Admin → Rooms page (admin-only). The page edits `rooms.base_price_ghs`.
- **Per-date rate overrides** are currently managed on the Admin → Inventory page by clicking a cell, which edits `room_inventory.rate_override`.
- Recent requests also added an `operations_manager` role that should not see Rooms, but may need to adjust pricing.

## What we will build

### 1. Inline price editing on the Rooms table
- Add a small, in-place input for `base_price_ghs` directly on each row in `src/pages/admin/Rooms.tsx`.
- Save on blur or Enter key. Show a loading/confirm state and a toast.
- Validate that the price is a positive number.

### 2. Role-based access
- Keep the existing page-level guard: only `admin` and `revenue_manager` can access `/admin/rooms`.
- `operations_manager` and `front_desk` will continue to be redirected to `/admin/bookings`.
- Adjust the sidebar so the Rooms nav item is visible only to those same roles.

### 3. Propagate changes automatically
- Updating `base_price_ghs` already triggers a DB trigger that clears stale `rate_override` values.
- After a successful inline save, we will re-run the dynamic pricing engine (as the existing full edit dialog already does) so the new base price is reflected across the inventory grid and the public booking page.
- Invalidate the `admin-rooms` and `admin-inventory` query caches so the dashboard and inventory update immediately.

## Technical details
- File: `src/pages/admin/Rooms.tsx`
- Add an `InlinePriceEdit` sub-component per row.
- Re-use the existing `saveMutation` pattern or a small dedicated `useMutation` for row-level updates.
- Keep the existing full edit dialog for all other room fields.

## Out of scope
- No new database tables or migrations (uses existing `rooms` and `room_inventory`).
- No changes to the public booking flow or pricing calculation logic.
