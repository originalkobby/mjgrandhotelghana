# Alternating row striping should start from the header

## Goal

Make the alternating grey/white banding on the Bookings table begin at the header row, so the first data row is the light-grey band and the pattern continues from there.

## Change

In `src/pages/admin/Bookings.tsx`, table body only:

- Change the data-row stripe condition from `i % 2 === 1` to `i % 2 === 0` so the first rendered data row (directly under the header) gets `bg-muted/40` and the second row keeps the surface background.
- Apply the same shift to the loading skeleton rows so the pattern stays consistent while data loads.
- Keep the existing header background solid (`bg-[hsl(var(--admin-surface))]`) so it acts as the starting point of the alternation.
- Preserve horizontal row separators, hover highlight, sticky header, and column layout.

## Technical details

- The row `className` becomes `i % 2 === 0 ? "bg-muted/40" : ""`, merged with the existing `border-b border-border/50 hover:bg-muted/60 transition-colors`.
- Loading skeleton rows use the same `i % 2 === 0` condition.
- No changes to data, filters, scrolling, or column structure.

## Outcome

The Bookings table alternates grey/white starting from the header, with the first booking row rendered in the light-grey band.
