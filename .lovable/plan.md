# Match admin Select dropdown background to the top banner

## Problem
On `/admin/food-orders` (and every admin page using `<Select>`), the dropdown content uses the shared `SelectContent`, which defaults to `bg-popover` — near-white in the admin's light theme. The shared `SelectItem` was previously switched to `text-cream` (near-white), so the open dropdown shows cream text on a near-white background and is effectively unreadable.

The top admin banner (`AdminLayout` header) uses `bg-admin-bar` with `text-admin-bar-foreground`. The user wants the dropdown background to match that banner.

## Scope
- One change in `src/components/ui/select.tsx`.
- Public `FoodOrder.tsx` already passes an explicit `bg-charcoal` override to its `SelectContent`, so it is unaffected by this default change.
- All admin pages that use `<SelectContent>` without an override (`Bookings`, `FoodOrders`, `GalleryManagement`, `MenuManagement`, `Promotions`, `Reports`, `SupportTickets`, `BulkBlockDatesDialog`) inherit the fix automatically.

## Change
In `src/components/ui/select.tsx`, update the `SelectContent` default classes:

- Replace `bg-popover text-popover-foreground` with `bg-admin-bar text-admin-bar-foreground`.
- Keep the existing border, rounded-md, shadow, and open/close animation classes unchanged.

This makes the open dropdown use the same warm banner colour as the admin header, so the already-cream `SelectItem` text reads correctly. The `SelectItem` focus state (`focus:bg-accent focus:text-accent-foreground`) already provides a gold highlight that works on this background, so no item-level change is needed.

## Verification
- Build/typecheck the project.
- Open `/admin/food-orders`, click the Status and Type filter dropdowns, and confirm the dropdown background matches the top banner and the status labels are clearly readable.
