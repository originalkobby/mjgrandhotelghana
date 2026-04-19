

## Goal
Repaint the inventory grid cells in `src/pages/admin/Inventory.tsx` so the booked-vs-total ratio reads instantly as a heatmap: red = 0 bookings, green = fully booked, with amber/yellow gradient in between. Closed dates stay neutral (muted) since they're a separate concept from occupancy.

## Color mapping (occupancy = booked / total)

| Occupancy | Color | Tailwind classes |
|-----------|-------|------------------|
| 0% (empty) | Red | `bg-red-100 text-red-700` |
| 1–39% (near zero) | Orange | `bg-orange-100 text-orange-700` |
| 40–69% (halfway) | Amber/yellow | `bg-amber-100 text-amber-800` |
| 70–99% (near full) | Lime | `bg-lime-100 text-lime-700` |
| 100% (full) | Green | `bg-green-100 text-green-800` |
| Closed | Muted (unchanged) | `bg-muted text-muted-foreground` |

These tones are soft enough to keep the minimalist luxury feel and stay readable against the existing card surface.

## Change
**File:** `src/pages/admin/Inventory.tsx`

Replace the `occupancyColor` helper (currently uses accent/gold/destructive thresholds) with the 5-step red→green ramp above. Order matters — check `closed` first, then `pct === 0`, then `pct >= 1`, then descending bands.

Update the legend swatches at the bottom of the page to match the new ramp:
- Empty (red) · Low (orange) · Half (amber) · Near Full (lime) · Full (green) · Closed (muted)

## Out of scope
- No change to the edit dialog, dynamic pricing, or data fetching.
- No tailwind config change — the `red/orange/amber/lime/green` palettes are stock Tailwind v3 and already available.

