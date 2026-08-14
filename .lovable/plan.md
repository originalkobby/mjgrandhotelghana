# Bulk close rooms for a date range

Add a "Block Dates" tool to the Inventory page so staff can make a room type unavailable across many days in one action, instead of clicking each day in the calendar grid.

## What the user gets

- A **Block Dates** button in the Inventory page header.
- A dialog with:
  - Room type selector (single room type, or "All room types")
  - Start date and end date (British DD/MM/YYYY display)
  - Optional closure reason (e.g. "Maintenance", "Private event")
  - Two actions: **Block dates** and **Unblock dates**
- A confirmation summary before saving ("This will close Executive Suite for 6 nights, 12/09/2026 – 17/09/2026").
- After saving, the grid refreshes and every affected day shows the dark "Closed" cell with the reason.
- A warning (not a blocker) if any day in the range already has bookings — closing does not cancel existing bookings, it only stops new ones.

## Technical notes

- Frontend only; no schema changes. `room_inventory` already has `is_closed` and `closure_reason`.
- New component `src/components/admin/BulkBlockDatesDialog.tsx`, rendered from `src/pages/admin/Inventory.tsx`.
- Save logic: build one row per (room, date) in range and `upsert` into `room_inventory` on the `(room_id, date)` conflict target, setting `is_closed`, `closure_reason`, and defaulting `total_count` from `rooms.total_units` and `booked_count` to the existing value (fetch existing rows in the range first so booked counts are preserved). Unblock sets `is_closed = false`, `closure_reason = null`.
- Reuse `useCurrency`/date helpers already in the page; refresh via `queryClient.invalidateQueries({ queryKey: ["admin-inventory"] })` — existing realtime subscription also picks up the change.
- Access follows the existing Inventory page gating (admin, front desk, operations manager).
