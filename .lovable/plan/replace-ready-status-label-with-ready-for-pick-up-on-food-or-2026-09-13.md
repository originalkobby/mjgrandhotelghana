# Replace "Ready" status label with "Ready for pick-up" on Food Orders

## Change
Update the `STATUS_LABELS` constant in `src/pages/admin/FoodOrders.tsx` (line 80):

- Before: `ready: "Ready",`
- After: `ready: "Ready for pick-up",`

This constant is the single source for the label shown in the status filter dropdown, the status badge column, and any advance-status action button text on the `/admin/food-orders` page. No other file references this label.

## Notes
- The stored status value (`ready`) stays unchanged, so existing orders are unaffected.
- The separate `ready_for_pickup` label in `src/lib/deliveryStatus.ts` (delivery tracking timeline) is a different status pipeline and is not touched.
