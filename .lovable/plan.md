# Change Category Text Color to Gold in Menu Management

## Goal
Update the category header rows in the `/admin/menu` table so all category names (e.g., “Beef Meals”) appear in the project’s gold accent color instead of the default foreground color.

## Current state
- File: `src/pages/admin/MenuManagement.tsx`
- Category rows are rendered at line ~276 inside a sticky sub-header row spanning the table.
- Current class uses `text-foreground`.

## Proposed change
- Replace the `text-foreground` class with `text-gold` on the category sub-header `<td>`.

## Verification
- Preview the `/admin/menu` route and confirm every category label appears in the gold color.
- Ensure no other table text is affected.
