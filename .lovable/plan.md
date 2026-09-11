# Enlarge the Google Map in the Delivery Picker

## Goal
Make the Google Map in the food-order delivery section fill a larger area so guests have more room to search, pan, and drop their pin.

## Change
File: `src/components/delivery/DeliveryLocationPicker.tsx` (line 248)

- Increase the map container height from `h-[280px]` to a taller, mobile-first responsive height:
  `h-[420px] md:h-[400px]`.
  - On mobile the map is the primary interaction surface, so it gets the tallest height (420px).
  - On desktop the surrounding two-column form layout leaves less vertical room, so 400px keeps it generous without overwhelming the page.
- No other layout or component changes needed — the map already stretches `w-full`, so only the height constrains its visible area.

## Notes
- This affects only the delivery address picker on `/food-order`.
- The OrderTracking page (`src/pages/OrderTracking.tsx`) has its own map at `h-[260px]`; leave that untouched unless you also want it enlarged.
