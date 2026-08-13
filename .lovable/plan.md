# Locked column headings + table-only vertical scroll

## Current state

- `src/pages/admin/Bookings.tsx` already uses a flex-column page (`h-full flex flex-col gap-6`), a `Card`/`CardContent` with `flex-1 min-h-0`, and a `<thead className="sticky top-0 z-10 ...">`.
- The table wrapper is now `overflow-auto`, which replaced the previous horizontal-only setup: the `tableScrollRef` and the custom `StickyHorizontalScrollbar` proxy bar were dropped.
- `src/pages/admin/AdminLayout.tsx` line 90 still has `<main className="flex-1 overflow-auto ...">`, so the page-level vertical scrollbar at the far right of the screen can still appear.

## Changes

1. Restore the horizontal scroll behaviour exactly as before:
   - Re-attach `ref={tableScrollRef}` to the table wrapper and re-apply the `scrollbar-x-always` class (hides the native horizontal bar).
   - Re-render `<StickyHorizontalScrollbar targetRef={tableScrollRef} />` beneath the table.
2. Keep column headings locked: `<thead>` stays `sticky top-0 z-10` with the admin surface background.
3. Vertical scroll lives in the table container only:
   - Wrapper gets `overflow-y: auto` in addition to the restored `overflow-x: scroll` (hidden native x bar), with `flex-1 min-h-0`.
4. Remove the page-level vertical scrollbar on this page by making the admin `main` area not scroll vertically when the page fills the height (`overflow-y-hidden` on the Bookings route container / `min-h-0` chain), leaving the table's own bar as the only vertical scrollbar.

## Technical details

- `src/pages/admin/Bookings.tsx`: wrapper becomes `className="flex-1 min-h-0 overflow-y-auto scrollbar-x-always"` with `ref={tableScrollRef}`; re-import `useRef` usage and `StickyHorizontalScrollbar`.
- `src/index.css`: `.scrollbar-x-always` sets `overflow-x: scroll` and hides the x bar; add nothing new — vertical is handled by the Tailwind class on the element.
- `src/pages/admin/AdminLayout.tsx`: change `main` to `flex-1 min-h-0 overflow-y-hidden overflow-x-auto` so child pages that set `h-full` own their vertical scrolling; other admin pages will be checked so they still scroll (they get their own `overflow-y-auto` wrapper if needed).
- Layout-only change; no data, auth, or booking logic touched.

## Outcome

Column headings stay locked while rows scroll inside the table card, the vertical scrollbar sits at the far right of the table instead of the page, and the custom horizontal scrollbar behaves exactly as it did before.
