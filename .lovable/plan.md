# Fix: table-owned vertical scrollbar on Bookings

## What's actually happening

The Bookings table already has a sticky header and an `overflow-y-auto` wrapper, but nothing above it caps the height to the viewport, so the whole page still grows and the browser/page scrollbar takes over:

- `src/pages/admin/AdminLayout.tsx` line 36: the shell uses `min-h-screen` (grow-only) instead of a fixed `h-screen`, so `flex-1 min-h-0` on `<main>` has no bounded height to shrink into.
- Line 38: the column wrapper (`flex-1 flex flex-col min-w-0`) is missing `min-h-0`, so the min-height chain breaks before it reaches `<main>`.
- `SidebarProvider` renders its own `min-h-svh` wrapper around everything, which also lets the page exceed the viewport.

Result: the table container never gets a constrained height, so it never scrolls internally and the page scrollbar remains.

## Proposed change

1. Give the admin shell a real viewport height and clip overflow at the top level so no page-level scrollbar can appear.
2. Repair the min-height chain down to `<main>` so the Bookings page can shrink-to-fit.
3. Keep `<main>` scrollable for all other admin pages (Overview, Guests, Rooms, etc.) so they are unaffected.
4. Leave the Bookings table markup as-is: sticky `<thead>`, `overflow-y-auto` wrapper, `scrollbar-x-always`, and the existing `StickyHorizontalScrollbar` proxy stay untouched.

## Technical details

In `src/pages/admin/AdminLayout.tsx`:
- Line 36: `min-h-screen` → `h-screen overflow-hidden` on the `.admin-shell` div, and add a `className` on `SidebarProvider` (`h-screen overflow-hidden w-full`) so its `min-h-svh` wrapper cannot expand past the viewport.
- Line 38: add `min-h-0` to `flex-1 flex flex-col min-w-0`.
- Line 90: keep `<main>` as `flex-1 min-h-0 overflow-y-auto flex flex-col` — pages that are not height-constrained keep scrolling inside main; Bookings, being `flex-1 min-h-0`, fits exactly and hands scrolling to its table container.

No changes to `src/pages/admin/Bookings.tsx`, data fetching, or horizontal scroll behaviour.

## Verification

Run a Playwright pass against `/admin/bookings` with an injected session at 1063x676, confirming: `document.body` has no vertical scroll, the table wrapper's `scrollHeight > clientHeight`, and the header row stays visible after scrolling the wrapper.
