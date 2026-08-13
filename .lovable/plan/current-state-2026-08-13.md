Lock the bookings table header row and move vertical scrolling into the table container.

## Current state

- `src/pages/admin/Bookings.tsx` renders the bookings table inside a `<Card>` as part of the normal page flow.
- The table wrapper (`<div ref={tableScrollRef} className="scrollbar-x-always">`) only enables horizontal scrolling.
- The table header scrolls out of view when the page is scrolled vertically, because the page-level scrollbar in the main content area carries the whole table.
- The user wants the header row to stay fixed, the table body to scroll independently, and the page-level scrollbar to disappear.

## Proposed change

1. Convert the bookings page layout to a flex column that fills the available height of the main content area.
2. Make the table container the only vertical scroll region, so its scrollbar appears on the far right of the table card.
3. Fix the `<thead>` (or its `<tr>`/`<th>` elements) at the top of the scrollable table container with a sticky position and a solid background.
4. Preserve the existing horizontal scroll behaviour for wide tables.
5. Ensure the bulk-selection toolbar, filters, and heading remain visible above the table while the body scrolls.

## Technical details

- In `src/pages/admin/Bookings.tsx`:
  - Wrap the page contents in a root element with `flex flex-col h-full`.
  - Make the table `<Card>` or `<CardContent>` a flex column with `flex-1 min-h-0` so it fills the remaining vertical space.
  - Replace the table wrapper's class with a class that enables both vertical and horizontal scrolling, e.g. `overflow-auto` (or keep horizontal scroll and add `overflow-y-auto` with a constrained height).
  - Set a max-height or flex-basis on the wrapper so it does not overflow the main area, relying on its own scrollbar instead of the page scrollbar.
  - Add `sticky top-0 z-10 bg-[hsl(var(--admin-surface))]` (or equivalent admin surface token) to the `<thead>` element, or to each `<th>`, so the header row remains visible while the `<tbody>` scrolls.
- Keep the existing `tableScrollRef` and the `StickyHorizontalScrollbar` usage if it is still needed; do not alter the horizontal scroll behaviour.
- Verify that the page title, subtitle, filter cluster, and bulk-selection toolbar stay outside the scrollable table area so they are always visible.
- No data, auth, or lifecycle logic is changed; this is a layout-only modification.

## Outcome

The bookings table will behave like a fixed-header data grid: the column headings stay in place, the rows scroll vertically within the table card, and the scrollbar is anchored to the table rather than the whole page.