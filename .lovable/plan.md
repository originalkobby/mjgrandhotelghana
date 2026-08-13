# Alternating row striping on the Bookings table

## Goal

Match the reference: rows alternate between white and a light grey band, with horizontal row separators only. No vertical column lines.

## Change

In `src/pages/admin/Bookings.tsx`, table body only:

- Add a zebra background to each rendered row: even rows keep the surface background, odd rows get a subtle muted background (`bg-muted/40`).
- Apply the same alternation to the loading skeleton rows so the pattern is consistent while data loads.
- Keep the existing hover highlight, which will sit above the stripe.
- Keep the existing bottom border per row (horizontal lines) and add no vertical borders.
- Sticky header keeps its solid surface background so stripes do not show through when scrolling.

## Technical details

- The row `className` becomes conditional on the map index `i`: `i % 2 === 1 ? "bg-muted/40" : ""`, merged with the current `border-b border-border/50 hover:bg-muted/30 transition-colors`.
- Hover stays visible by keeping `hover:bg-muted/30` applied last, or by using a slightly stronger hover token if the stripe overrides it.
- No changes to data, filters, scrolling, or column structure.

## Outcome

The Bookings table shows clean alternating grey/white rows with only horizontal separators, matching the reference image.
