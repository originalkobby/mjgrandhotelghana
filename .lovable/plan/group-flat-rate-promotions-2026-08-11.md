# Group Flat-Rate Promotions

Enable a promo code that gives every booking in a group the same nightly room rate, no matter which room type each guest books.

## How it works

- A new promo type: **Flat nightly rate**. Instead of a percentage or fixed discount, you enter one nightly price (e.g. $100 per night).
- Any guest who enters the code during booking is charged that nightly rate for their room, whatever the room type. Total = flat rate x nights.
- Group size is controlled by the existing **usage limit** — set it to the number of rooms in the group; each completed booking consumes one use.
- If a room's normal rate is already lower than the flat rate, the guest keeps the lower rate (the promo never increases the price).
- Existing date window, active toggle and room restrictions keep working the same way.

## Where it shows up

- **Admin > Promotions**: the discount type selector gains "Flat nightly rate", and the value field label switches to "Nightly rate (GH₵)". The table shows the rate as e.g. "Flat GH₵1,250/night".
- **Booking engine**: the Booking Summary shows the original room total struck through, the flat group rate line, and the discount amount, exactly like current promos.

## Technical notes

- Migration: allow `flat_rate` as a `discount_type` value in `public.promotions` (stored value = nightly rate in GH₵, consistent with `base_price_ghs`). No new columns needed.
- `supabase/functions/validate-promo/index.ts`: accept `nights` in the request body; for `flat_rate`, compute `promoTotal = discount_value * nights` and return `discountGhs = max(0, baseTotalGhs - promoTotal)`. All existing checks (active, dates, usage limit, room restrictions) run unchanged.
- `src/pages/Booking.tsx`: pass `nights` to the validate call (already derived from check-in/check-out).
- `src/hooks/useBooking.ts`: no math change — total still uses the returned `discountGhs`.
- `src/pages/admin/Promotions.tsx`: add the `flat_rate` option, dynamic value label, and table formatting.
- Summary components (`GuestDetailsStep.tsx`, `PaymentStep.tsx`) reuse the existing promo block; add the "Group flat rate" wording when the applied promo type is `flat_rate`.
