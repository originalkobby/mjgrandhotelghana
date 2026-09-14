# Convert Side-Orders Collapsible into a Multi-Select Dropdown

## Goal
On `/food-order`, replace the current "Side orders (optional)" **collapsible** block with a **dropdown menu** (popover-based) that opens to reveal all side options with their prices, lets the customer toggle multiple sides on/off, and shows a quantity stepper next to each selected side. Prices stay visible exactly as they are today (name + `GH₵` price per row). The "Quantity" stepper for the main dish stays on the right of the same row.

## Current state
- `src/pages/FoodOrder.tsx` (lines ~436–524): a `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` block. The trigger button ("Side orders (optional)" + selected-count badge + rotating `ChevronDown`) sits left; the main-dish `Qty` stepper sits right in the same `flex` row. Expanding reveals a 2-column grid of side rows (name + price), each tappable to toggle, with a small `− qty +` stepper when selected.
- State already in place: `selectedSides` (name→qty), `sidesOpen`, `toggleSide`, `setSideQty`, `chosenSides`, `sideOptions`, `sidesTotal`. No logic changes needed — only the presentation container changes.
- `src/components/ui/popover.tsx` exists (`Popover`, `PopoverTrigger`, `PopoverContent`) — use it instead of the Collapsible primitives. No new dependency.
- `ChevronDown` is already imported from lucide-react.

## Change (single file: `src/pages/FoodOrder.tsx`, layout only)

1. **Imports**
   - Remove the `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` import (line 31).
   - Add `import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";`.
   - `ChevronDown` stays (already imported).

2. **State**
   - Replace `sidesOpen`/`setSidesOpen` usage with the Popover's own open state. Keep a `sidesOpen` boolean (driven by `Popover open`/`onOpenChange`) so the chevron rotation and badge still work — no new state needed; just wire `Popover open={sidesOpen} onOpenChange={setSidesOpen}`.
   - Remove the `setSidesOpen(false)` reset in the category-change effect only if it causes issues; otherwise leave it (it simply closes the dropdown on dish change, which is desirable).

3. **Trigger (left side of the row)**
   - Replace `Collapsible` + `CollapsibleTrigger` with `Popover` + `PopoverTrigger asChild`.
   - Keep the same trigger button styling and content: "Side orders (optional)" label, the `{chosenSides.length} selected` gold badge when sides are chosen, and a `ChevronDown` that rotates 180° when `sidesOpen`.

4. **Dropdown panel (replaces `CollapsibleContent`)**
   - `PopoverContent` styled to match the page: `bg-charcoal border-cream/10 rounded-none w-[min(92vw,22rem)]` (square corners per the page's existing convention), positioned below the trigger.
   - Inside, render the same per-side list as today, but as a vertical list (not the 2-col grid) so it reads as a menu. Each row:
     - Left: side name + price (`GH₵ 50`), same styling as the current grid row.
     - Tap the row (a button) to toggle selection; selected rows get `border-gold/50 bg-gold/10` and gold name text, matching today.
     - When selected, show the inline `− qty +` stepper (same as current) on the right of that row.
   - Add `max-h-72 overflow-y-auto` so a long side list scrolls within the dropdown.
   - Close behavior: keep the dropdown open while toggling/adjusting (Popover default closes on outside click, which is fine — selections persist in state regardless of open/closed, same as today).

5. **Right side of the row**
   - The main-dish `Qty` stepper stays exactly as-is (right side of the shared `flex items-center justify-between gap-4` row).

6. **No-sides categories** (Pizza, Burgers & Sandwiches, etc.)
   - `sideOptions.length === 0` branch is unchanged: the standalone "Quantity" block renders as today, no dropdown appears.

## Scope
- Single file: `src/pages/FoodOrder.tsx`.
- No backend, no data, no pricing/order-payload logic changes. `selectedSides`, `chosenSides`, `sidesTotal`, `subtotal`, and the submit payload are untouched.
- Existing square-corner and `bg-charcoal` styling conventions preserved.

## Verification
- `bunx tsgo --noEmit -p tsconfig.app.json` passes.
- Browser check at `/food-order?item=Grilled+Tilapia&price=GH₵+150&category=Local%20Dishes` (handle the first-time customer dialog if it appears): the "Side orders (optional)" trigger opens a dropdown listing all sides with prices; tapping a side highlights it and reveals a qty stepper; choosing 2 sides and adjusting quantities updates the selected-count badge and the live total; closing the dropdown keeps selections; the main-dish Qty stepper remains on the right of the row.
- Browser check with `category=Pizza`: no side-orders dropdown, only the standalone Quantity block.
