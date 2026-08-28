# Food Orders access for Operations Manager and F&B staff

## What changes

1. **Operations Manager gets Food Orders** — already present in the sidebar list; confirm and keep, plus ensure the route is reachable for that role.
2. **New role: `restaurant_staff`** — added to the `app_role` list. Members can sign in to the dashboard and see only the Food Orders page. Every other admin area is hidden and blocked by direct URL.
3. **New login account** — `f&b@mjgrandhotelghana.com` created with the `restaurant_staff` role, email pre-confirmed, with a temporary password to change on first sign-in.
4. **Cleaner Food Orders header** — on `/admin/food-orders` the currency toggle and exchange-rate readout are hidden, and the header title reads "Order Command Center" instead of "Booking Command Center".

## Technical notes

- Migration: `ALTER TYPE public.app_role ADD VALUE 'restaurant_staff';` then extend the RLS policies on `food_orders`, `food_order_items`, and `delivery_zones` (read) so `restaurant_staff` can view and update order status. No other tables get access.
- `src/hooks/useAdminAuth.ts`: add `restaurant_staff` to the `AdminRole` union.
- `src/components/admin/AdminSidebar.tsx`: add `restaurant_staff` to the Food Orders item only; Overview stays restricted so the sidebar shows a single item for this role.
- `src/pages/admin/AdminLayout.tsx`: title and currency rail become route-aware via `useLocation()` — on `/admin/food-orders` show "Order Command Center" and hide the USD/GH₵ toggle and exchange-rate block (notification bell stays).
- Landing route: `restaurant_staff` signing in at `/admin` is redirected to `/admin/food-orders`; other admin routes redirect back there too.
- The account is created via a one-off admin call using the service role key (auth accounts cannot be created from a migration). Password will be shared in chat for immediate change.

## Out of scope

- Any change to booking, guest, inventory, or reporting permissions.
- Kitchen ticket printing or per-station order routing.
