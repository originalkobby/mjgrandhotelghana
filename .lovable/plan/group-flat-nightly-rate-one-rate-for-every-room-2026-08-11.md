# Group Flat Nightly Rate: one rate for every room

Confirmed behaviour: when a group flat rate of 90 is set, every guest in the group pays 90 per night regardless of room type. Total = 90 x nights (e.g. Junior Suite, 5 nights = 450). The rate is fixed; only the number of nights varies.

## What changes

- **Rate always wins.** If a room's normal rate is lower than the flat rate, the guest still pays the flat rate. The promo can raise or lower the price.
- **Currency label.** The flat rate is entered in the same unit as room rates (USD, e.g. 110 for Single). Admin > Promotions will label the field "Flat Nightly Rate (USD)" and show "Flat $90/night" in the table, so nobody enters a cedi figure by mistake.
- **Booking Summary wording.** For a flat-rate promo the summary shows a clear line: "Group flat rate: $90 x 5 nights = $450", and instead of a "Discount" line with a negative number it shows either a discount (rate below room price) or an "Adjustment" line (rate above room price).
- Nights continue to come from the guest's actual check-in/check-out dates; if dates are missing the promo isn't applied and the guest is told to pick dates.

## Technical notes

- `supabase/functions/validate-promo/index.ts`: keep `discountGhs = baseTotalGhs - discount_value * nights` (may be negative, meaning an uplift) and return `nights` plus a computed `flatTotalGhs`. No clamping to zero.
- `src/hooks/useBooking.ts`: `totalAmount` already subtracts `discountGhs`, so a negative discount raises the total; keep the `Math.max(0, ...)` floor only against going below zero.
- `src/components/booking/GuestDetailsStep.tsx` and `PaymentStep.tsx`: for `discountType === "flat_rate"`, render the `rate x nights = total` breakdown and switch the label to "Adjustment" with a positive amount when `discountGhs < 0`.
- `src/pages/admin/Promotions.tsx`: change the flat-rate value label to USD and format the table cell as `Flat $<rate>/night`.
- No database migration required.
