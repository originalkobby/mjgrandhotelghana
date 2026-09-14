# Side Orders + Quantity on One Line

## Goal
On `/food-order`, place the **Side orders (optional)** trigger and the **Quantity** stepper on the same horizontal row — Side orders on the left, Quantity on the right — so the form reads more elegantly and uses vertical space better.

## Current state
- "Quantity" is its own labelled block (lines 436–455): a `Label` then a `− value +` stepper.
- "Side orders (optional)" is a `Collapsible` block (lines 457+): a full-width trigger button (label + chevron + badge) with the grid expanding below.
- The two are stacked vertically.

## Approach
Single file: `src/pages/FoodOrder.tsx`. Layout change only, no logic/data change.

1. Replace the two separate stacked blocks with one shared flex row container: `flex items-center justify-between gap-4`.
2. **Left side** — keep the `Collapsible` but only its trigger is in the row:
   - The trigger button keeps its current styling (label text "Side orders (optional)", selected-count badge when sides are chosen, rotating chevron).
   - Remove the trigger's full-width `w-full` and `justify-between` so it sits naturally on the left; the chevron stays next to the label.
3. **Right side** — the Quantity stepper inline, compact:
   - Keep the `− value +` stepper control exactly as-is (same buttons/size).
   - Drop the separate "Quantity" label line; instead place a small "Qty" label or none — keep the stepper self-explanatory. (Stepper visually reads as quantity.)
4. The `CollapsibleContent` (the side-option grid) stays inside the `Collapsible` and expands below the row when opened, spanning full width as before.

### Handling categories with no side orders
When `sideOptions.length === 0` (Pizza, Burgers, etc.), the `Collapsible` is not rendered. In that case the row should still show the Quantity stepper on its own (left-aligned or full-width as today). Implement by:
- If sides exist: the two-column flex row (Side orders left, Quantity right).
- If no sides: keep the existing standalone Quantity block unchanged.

## Verification
- `bunx tsgo --noEmit -p tsconfig.app.json` passes.
- Browser check at `/food-order?item=Grilled+Tilapia&...&category=Local Dishes`: Side orders trigger on the left and Quantity stepper on the right on the same line; expanding Side orders shows the grid below without shifting Quantity; selecting sides updates the badge and total; a Pizza category shows only the Quantity stepper.
