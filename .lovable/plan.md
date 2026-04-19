

## Goal
Make the inventory grid render as a tight, evenly-spaced grid of square cells (like the screenshot) on all viewports including full desktop — not stretched across the available width.

## Observation
The screenshot shows: room label column on the left + 6–7 fixed-size square cells per row with consistent small gaps. Currently on wide desktops the table stretches and `min-w-[100px]` columns expand; the screenshot's compact density is what we want preserved.

## Change
**File:** `src/pages/admin/Inventory.tsx`

1. Remove the table's `w-full` so it sizes to its content instead of filling the container.
2. Lock the day-column header width to match the cell (`w-[100px]`, drop `min-w-[100px]`) so headers don't stretch on wide screens.
3. Keep cells at fixed `w-[100px] h-[100px]` (already done).
4. Wrap the table inside the existing `overflow-x-auto` so on narrow screens it still scrolls horizontally.
5. Keep small consistent padding (`px-1 py-1`) on the cell `<td>` to mimic the gap rhythm in the screenshot.

Net effect: on a 1920px monitor the grid no longer stretches — it stays compact and left-aligned exactly like the screenshot, while still scrolling on small screens.

## Out of scope
- No change to colors, tooltips, edit dialog, or data fetching.
- No change to the room label column width.

