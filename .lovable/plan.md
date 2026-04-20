

## Goal
Replace the per-row `Trash2` action with a Supabase-style bulk-delete pattern: a leading checkbox column, a header "select all" checkbox, and a contextual toolbar that appears once one or more rows are checked, prompting confirmation before deleting one or many bookings at once. Admin-only.

## UX flow
1. A new checkbox is the first column (before "Ref"). Hidden for non-admins.
2. Header checkbox toggles select-all for the currently filtered/visible rows. Indeterminate state when some (but not all) are selected.
3. When at least one row is checked, a toolbar appears above the table:
   ```
   ┌────────────────────────────────────────────────┐
   │ 🗑  Delete N selected   [Clear selection]       │
   └────────────────────────────────────────────────┘
   ```
4. Clicking "Delete N selected" opens an `AlertDialog`:
   - Title: "Delete N booking(s)?"
   - Description: lists up to 5 reference codes, then "…and X more" if truncated. Warns the action is permanent and includes add-ons, payment logs, and audit history.
   - Confirm button: `Delete permanently` (destructive). Cancel.
5. On confirm: release inventory for any `pending`/`confirmed` rows, cascade-delete dependents (`booking_add_ons`, `payment_logs`, `booking_audit_log`) then `bookings`, in parallel batches. Show a single toast: "Deleted N bookings". On partial failure, toast lists how many succeeded/failed. Selection clears, queries invalidate.

## Edits — `src/pages/admin/Bookings.tsx`

1. **Imports**: drop `Trash2` (no longer used per-row); add `Checkbox` from `@/components/ui/checkbox`.
2. **State**: replace `deleteBooking`/`setDeleteBooking` (single) with:
   - `selectedIds: Set<string>` + setter
   - `bulkDeleteOpen: boolean`
   - keep `deleting: boolean`
3. **Derived**: `allVisibleSelected`, `someVisibleSelected` from `bookings` + `selectedIds` for header checkbox state.
4. **Handlers**:
   - `toggleRow(id)`, `toggleAll()`, `clearSelection()`
   - Rewrite `handleDeleteBooking` → `handleBulkDelete`: iterates the selected booking objects (looked up from `bookings` by id), runs the same release-inventory + dependent-row cleanup + bookings delete per id, accumulates success/failure counts, then invalidates `admin-bookings`, `admin-inventory`, `admin-overview`.
5. **Table header**: prepend a `<th className="w-10 px-4 py-3">` with the master `Checkbox` (admin only; otherwise empty cell to keep alignment off).
6. **Table body**: prepend a `<td>` with per-row `Checkbox` bound to `selectedIds.has(b.id)` (admin only).
7. **Actions column**: remove the `Trash2` button block (lines ~581–591). Keep "Manage" and "Record payment".
8. **Selection toolbar**: render between the filter row and the `Card` when `isAdmin && selectedIds.size > 0`. Uses muted background, destructive button for delete.
9. **AlertDialog**: repurpose the existing one for bulk confirmation (title/description updated to plural with reference list preview).
10. **Loading/empty rows**: bump skeleton/empty `colSpan` from 12 → 13 when admin, conditionally.

## Out of scope
- No DB migration (RLS DELETE policies for admin already exist on `bookings`, `booking_add_ons`, `booking_audit_log`, `payment_logs`).
- No change to status colors, source colors, payment recording, manage dialog, CSV export, or filtering.
- Bulk operations other than delete (e.g. bulk status change) are not added.

