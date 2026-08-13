# Add table-only vertical scrolling

## Current state

- The Bookings table wrapper already uses `overflow-y-auto` and is height-constrained by the existing flex layout.
- The wrapper also uses `.scrollbar-x-always` to preserve the custom horizontal scrollbar.
- In `src/index.css`, `.scrollbar-x-always::-webkit-scrollbar` currently hides the entire native scrollbar. This suppresses the vertical scrollbar as well as the native horizontal one.

## Change

1. Update only the `.scrollbar-x-always` scrollbar styling so the native horizontal scrollbar remains hidden while the native vertical scrollbar is visible.
2. Keep the Bookings table wrapper, sticky column headings, and `StickyHorizontalScrollbar` unchanged.
3. Keep the admin page layout unchanged so scrolling remains within the table rather than introducing another page scrollbar.

## Technical details

- Replace the all-axis WebKit scrollbar hiding rule with orientation-specific rules:
  - hide or collapse `::-webkit-scrollbar:horizontal`;
  - retain a usable `::-webkit-scrollbar:vertical` width and thumb styling.
- Remove the Firefox rule that hides both scrollbar axes; use compatible scrollbar colours/width where possible without changing horizontal behaviour in Chromium.
- Verify at `/admin/bookings` that rows scroll upward and downward inside the table, the header remains locked, and the existing horizontal proxy scrollbar is unchanged.

## Outcome

A visible vertical scrollbar appears at the far right edge of the Bookings table and scrolls only the table rows upward and downward, while the page and horizontal scrollbar behaviour remain unchanged.
