# Expand Food Order Page to Full Width

## Goal
Make the food order form span the full available width, coinciding with the far left and right edges, instead of being capped at `max-w-2xl`.

## Change
File: `src/pages/FoodOrder.tsx` (line 200)

- Replace `className="max-w-2xl mx-auto"` on the `motion.div` wrapper with `className="w-full"` so the card stretches to the container edges on both sides.
- The container (`container mx-auto px-4 sm:px-6 lg:px-12`) already provides the outer page gutters, so the card will reach the far edges while keeping consistent side padding.

No other files or layout changes needed.
