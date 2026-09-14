# Size/price dropdown for multi-priced meals on /food-order

## Goal
When a meal has more than one price because of size (e.g. "M: GH₵ 150 / L: GH₵ 200" on tilapia, "L: GH₵ 200 / M: GH₵ 150" on pizzas), the customer picks the size from a dropdown instead of seeing one merged price string. The chosen size drives the unit price, the order summary, and what the kitchen sees.

## Current state
- `src/pages/FoodOrder.tsx` keeps the raw price string in `itemPrice` and reduces it to a number with `parsePrice()` (strips non-digits — "M: GH₵ 150 / L: GH₵ 200" becomes nonsense).
- `supabase/functions/place-food-order/index.ts` re-prices every item server-side by matching the dish name against `menu_items.price` with the same naive digit-stripping — multi-size strings would be mispriced server-side today.
- Affected dishes (from the live menu data): Grilled/Fried Tilapia (M/L), Grilled Tilapia (M/L) in Local Dishes, all Pizzas (L/M).

## Changes

### 1. Shared size-price parser — `src/lib/sizePricing.ts` (new)
- `parseSizePrices(price: string): { label: string; price: number }[]` — recognises patterns like `M: GH₵ 150 / L: GH₵ 200`, `L: GH₵ 200 / M: GH₵ 150`; returns `[]` for single-price items.
- Maps shorthand to friendly labels: M → "Medium", L → "Large" (falls back to the raw label otherwise).

### 2. Food order page — `src/pages/FoodOrder.tsx`
- When `parseSizePrices(itemPrice)` returns 2+ options, replace the free-text "Unit price" input with a **Size dropdown** (existing square-cornered Select/Popover styling, charcoal/gold to match the page) listing e.g. "Medium — GH₵ 150", "Large — GH₵ 200". Default to the first size.
- `unitPrice` = the selected size's price; quantity stepper, sides dropdown, subtotal/total all use it unchanged.
- Summary line shows the size, e.g. "Grilled/Fried Tilapia (Medium) × 2".
- Single-price dishes keep the existing unit-price field exactly as-is.
- On submit, the item is sent as `name: "<Dish> (<Size>)"` with the size's price.

### 3. Server re-pricing — `supabase/functions/place-food-order/index.ts`
- When matching an incoming item, detect a trailing `(Size)` suffix in the name, strip it to find the base menu row, then parse that row's price string for size variants and price by the selected size.
- Unknown/missing size on a multi-size dish → 400 with a clear message (never silently misprice).
- Kitchen/staff views and confirmation emails already render the item name, so they'll show "Dish (Size)" with no further changes.

## Verification
- `tsgo` typecheck.
- Playwright on `/food-order?item=Grilled%2FFried+Tilapia&price=M%3A+GH%E2%82%B5+150+%2F+L%3A+GH%E2%82%B5+200&category=Fish`: dropdown shows both sizes, switching updates unit price and totals, placing the order stores the sized name and correct server-side price.
- Repeat for a single-price dish (no dropdown appears, nothing changes).
