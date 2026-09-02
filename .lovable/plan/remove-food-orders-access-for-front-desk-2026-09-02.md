# Remove Food Orders access for Front Desk

Front desk staff currently see and can open `/admin/food-orders`. This removes that access completely — in the UI and at the database level.

## What changes

- **Sidebar**: the Food Orders link no longer appears for `front_desk` users (stays for `admin`, `operations_manager`, `restaurant_staff`).
- **Route guard**: a `front_desk` user who navigates directly to `/admin/food-orders` (typed URL, bookmark) is redirected back to the main dashboard (`/admin`).
- **Database access**: RLS policies on `food_orders` and `food_order_items` are updated so `front_desk` can no longer view, create, update, or delete food orders — even via a crafted API call. Access remains unchanged for `admin`, `operations_manager`, and `restaurant_staff`.

## Technical notes

- `src/components/admin/AdminSidebar.tsx`: remove `"front_desk"` from the Food Orders item's `roles` array.
- `src/pages/admin/AdminLayout.tsx`: add a guard — `if (role === "front_desk" && isFoodOrders) return <Navigate to="/admin" replace />`.
- Migration: drop and recreate the view/create/update policies on `food_orders` and `food_order_items`, removing `has_role(auth.uid(), 'front_desk')` from each (delete is already admin-only). `delivery_zones` read access is left as-is since it contains no sensitive data; it can be tightened too if preferred.

## Out of scope

- Any change to front desk access to Bookings, Guests, Inventory, Support, Messages, or Overview.
