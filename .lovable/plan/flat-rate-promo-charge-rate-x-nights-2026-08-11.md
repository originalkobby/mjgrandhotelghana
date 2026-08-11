# Flat-Rate Promo: Charge Rate x Nights

Confirming the intended behaviour: a flat-rate promo of GH₵90 on a 6-night stay must total 90 x 6 = 540, not 90 for the whole stay and not one night only.

## What changes

- The flat nightly rate is always multiplied by the number of nights of the stay.
- The number of nights is taken from the guest's actual check-in and check-out dates, not from a value the browser can leave empty. If the dates are missing or invalid, the promo is simply not applied instead of silently falling back to one night (the current fallback is what can make a stay look like a single-night charge).
- The booking summary wording makes the maths explicit, e.g. "Group flat rate: GH₵90 x 6 nights = GH₵540".
- Admin > Promotions keeps the "Flat Nightly Rate (GH₵)" label and shows e.g. "Flat GH₵90/night" in the table.

## Technical notes

- `supabase/functions/validate-promo/index.ts`: accept `checkIn` and `checkOut` in the body and derive nights server-side (`differenceInDays`); use the client-sent `nights` only as a cross-check. Remove the `n = 1` fallback — when nights cannot be resolved, return `{ valid: false, reason: "invalid_input" }`. Keep `discountGhs = max(0, baseTotalGhs - rate * nights)` so the promo never raises the price.
- `src/pages/Booking.tsx`: pass `checkIn`/`checkOut` (ISO date strings) alongside `nights` in the `validate-promo` invoke, and add the dates to the effect's dependency list so the promo re-validates when the stay length changes.
- `src/components/booking/GuestDetailsStep.tsx` and `PaymentStep.tsx`: show the `rate x nights = total` breakdown in the promo block for `flat_rate` promos.
- No database migration needed; `flat_rate` already exists in the `discount_type` check constraint.
