

## Goal
Recolor the booking status badges in `src/pages/admin/Bookings.tsx` per the new spec, and confirm that Cancelled / Released (`completed`) / No Show all auto-release inventory.

## Color spec → Tailwind
| Status (DB) | UI label | Class |
|---|---|---|
| `confirmed` | Confirmed | `bg-green-600 text-white border-green-700` |
| `cancelled` | Cancelled | `bg-red-600 text-white border-red-700` |
| `completed` | Released | `bg-amber-800 text-white border-amber-900` (brown) |
| `no_show` | No Show | `bg-[#722F37] text-white border-[#5a252c]` (wine) |
| `pending` | Pending | keep existing gold |

## Inventory release — already correct, no code change needed
`src/lib/inventorySync.ts` already defines:
```
RELEASED = { "cancelled", "no_show", "completed" }
```
and `handleStatusUpdate` in `Bookings.tsx` already calls `getInventoryAction(oldStatus, newStatus)` → `releaseInventory()` whenever a booking moves from `pending`/`confirmed` into any of those three. So setting status to Cancelled, Released, or No Show from the dialog automatically increments room availability for every night of the stay and writes an audit-log note. No additional wiring required.

## Single edit
**File:** `src/pages/admin/Bookings.tsx`, lines 71–77 — replace the `STATUS_COLORS` map with the values above.

## Out of scope
- No DB / edge-function changes.
- No change to `STATUS_LABELS`, payment colors, or the status update flow.

