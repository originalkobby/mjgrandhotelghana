# Side Orders on the Food Order Page

Show selectable side orders on `/food-order` whenever the selected meal can have sides, and let the customer add them (with quantities) to their order.

## Behaviour

- When the customer arrives from the menu, the page knows the dish's category from the `category` URL parameter.
- Categories with **no** side orders (per your note): **Burgers & Sandwiches, Pizza, Desserts, Salads**. Also excluded: Extras, Side Orders, Take Out Packs, Kids Meals (ordering a side as the main item shouldn't offer more sides).
- Every other meal (Chicken, Fish, Beef, Seafood, MJ Specials, Local Dishes, Vegetarian, etc.) shows the full **Side Orders** list (Fried Rice, Jollof Rice, Kelewele, Banku, etc.), sourced from the live menu data (`usePublicMenu`), so prices always match the website.
- Each side is a tappable row showing name and price, with a quantity stepper (same square-cornered style as the existing quantity control). Tapping selects it with quantity 1; the customer can adjust quantity or remove it.
- Selected sides are added to the order summary: the subtotal line already shown for delivery becomes "Items subtotal" and includes sides; **Total due** updates live.
- On submit, sides are sent as extra `items` entries to `place-food-order`. The edge function already accepts up to 30 items, re-prices each server-side against `menu_items` by name (never trusting client prices), and stores them in `food_order_items` — so the kitchen sees them on the dashboard and in confirmation emails with **no backend changes**.
- The confirmation screen lists the main dish and each selected side with quantities and the updated total.

## Changes (frontend only)

1. **`src/pages/FoodOrder.tsx`**
   - New `selectedSides` state: map of side name → quantity; cleared when the dish/category changes.
   - `NO_SIDES` set of excluded categories; `showSides = !NO_SIDES.has(initialCategory)`.
   - New "Side orders (optional)" section rendered between the quantity stepper and Order type, only when `showSides` and the menu's Side Orders list is non-empty.
   - `subtotal` = dish total + sum of side lines; `items` payload includes sides; confirmation summary lists sides.
   - Dish field remains free-typed: sides shown depend only on the category param, so a manually typed dish still works.

## Verification

- TypeScript check passes.
- Browser smoke test: open `/food-order?item=Grilled/Fried Tilapia&price=GH₵ 150&category=Fish Meals` — sides appear; add 2 × Jollof Rice and 1 × Banku; total updates; place a cash-on-delivery takeaway order; order appears on the admin Food Orders page with all three items.
- Repeat with `category=Pizza` — no side orders section shown.
