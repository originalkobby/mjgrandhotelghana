# Expandable Category Rows in Menu Management

## Goal
Make the category header rows on `/admin/menu` interactive: clicking a category expands or collapses its items, and the row provides clear hover/focus feedback so it feels clickable and consistent with the rest of the dashboard.

## Current state
- File: `src/pages/admin/MenuManagement.tsx`
- Category rows are static sticky sub-headers spanning all columns.
- They have no hover styles, cursor pointer, or click handlers.
- Items under each category are always visible.

## Proposed changes
- Add local state to track which categories are collapsed (`Set<string>` or object keyed by category name).
- Make each category header row clickable:
  - Add `cursor-pointer` and a hover background (e.g., `hover:bg-cream/5` or `hover:bg-muted/60`).
  - Add a chevron icon (`ChevronDown` / `ChevronRight`) that rotates to indicate expanded/collapsed state.
- Conditionally render the item rows below a category header only when that category is expanded.
- Preserve the existing gold text color and sticky positioning.
- Ensure the zebra-striping index still works correctly when some rows are hidden (or reset per visible category).

## Verification
- Preview `/admin/menu` and confirm each category header shows a chevron and hover state.
- Click a category header to collapse its items; click again to expand them.
- Verify sticky headers and gold text remain intact.
- Confirm no visual regressions in table alignment or striping.
