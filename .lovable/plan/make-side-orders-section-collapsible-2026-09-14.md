# Make Side Orders Section Collapsible

## Goal
Wrap the existing "Side orders (optional)" block on `/food-order` in a collapsible control so the full side list stays hidden by default and expands on tap. Keeps the page elegant and uncluttered when customers don't need sides.

## Approach
- Use the existing `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` primitives from `src/components/ui/collapsible.tsx` (already in the project — no new dependency).
- Add `ChevronDown` to the lucide-react import in `src/pages/FoodOrder.tsx`.
- Add a small `sidesOpen` boolean state (default `false`).
- Replace the plain `<Label>` + grid wrapper with:
  - A `CollapsibleTrigger` styled as a subtle header row: label text on the left, a rotating chevron on the right, and a count badge showing how many sides are selected (e.g. "2 selected") when `chosenSides.length > 0`.
  - `CollapsibleContent` wrapping the existing side-option grid (unchanged internally).
- Smooth open/close via the existing Framer Motion height/opacity transition already used elsewhere on the page, matching the luxury minimal aesthetic (no bounce).
- Selection state persists across open/close; selected sides remain visible in the order summary regardless of collapse state.

## Scope
- Single file: `src/pages/FoodOrder.tsx`.
- No backend, no data, no pricing logic changes.
- Excluded categories (Pizza, Burgers & Sandwiches, etc.) remain excluded — the collapsible simply won't render.

## Verification
- `bunx tsgo --noEmit -p tsconfig.app.json` passes.
- Browser check at `/food-order?item=Grilled Tilapia&...&category=Local Dishes`: section is collapsed by default, expands on click, chevron rotates, selections persist, totals update; a Pizza category shows no side-orders block.
