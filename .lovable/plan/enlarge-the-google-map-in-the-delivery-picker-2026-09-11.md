# Enlarge the Google Map in the Delivery Picker

## Goal
Make the Google Map in the food-order delivery section fill a larger area — taller (especially on mobile) and spanning to the far left and right edges — so guests have more room to search, pan, and drop their pin.

## Changes

### 1. Taller map height — `src/components/delivery/DeliveryLocationPicker.tsx` (line 248)
- Increase the map container height from `h-[280px]` to a mobile-first responsive height:
  `h-[420px] md:h-[400px]`.
  - On mobile the map is the primary interaction surface, so it gets the tallest height (420px).
  - On desktop the surrounding two-column form layout leaves less vertical room, so 400px keeps it generous without overwhelming the page.

### 2. Edge-to-edge map width — `src/pages/FoodOrder.tsx` (around line 348)
- The delivery section wrapper currently has `className="space-y-4 p-4"`, which insets the map from the card edges.
- Remove the horizontal padding (use `px-0` or negative margins) so the map stretches flush to the far left and right card edges.
- Keep vertical spacing (`py-4` or equivalent) so the map still has breathing room above and below.

## Notes
- This affects only the delivery address picker on `/food-order`.
- The OrderTracking page (`src/pages/OrderTracking.tsx`) has its own map at `h-[260px]`; leave that untouched unless you also want it enlarged.
