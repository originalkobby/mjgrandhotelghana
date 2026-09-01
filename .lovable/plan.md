# Admin delete for food orders

Bring `/admin/food-orders` in line with `/admin/bookings`: admins can select and delete orders; other staff cannot.

## What changes

- Checkbox column (admin only) on the food orders table, with a select-all checkbox in the header.
- Selection toolbar above the table showing "N orders selected", a Clear selection button, and a red "Delete N selected" button.
- Confirmation dialog before deleting, with a success/failure toast summary afterwards.
- Non-admin roles (operations manager, front desk, restaurant staff) see no checkboxes, no toolbar, and no delete action — their existing status controls stay as they are.
- Deleting an order also removes its line items automatically.

## Access rules

Today every staff role can delete food orders at the database level. That gets tightened: only admins may delete. Viewing, creating, and status updates stay unchanged for all staff roles.

## Technical notes

- Migration: replace the `ALL` policy on `food_orders` and `food_order_items` with separate view/create/update policies for all staff roles, plus a delete policy restricted to `has_role(auth.uid(), 'admin')`.
- `food_order_items.food_order_id` already cascades on delete, so no manual child cleanup is needed.
- `src/pages/admin/FoodOrders.tsx`: add `selectedIds` state, `isAdmin` from `useAdminAuth`, checkbox column, bulk toolbar, an AlertDialog confirm, and a delete loop that invalidates the `admin-food-orders` query. Mirrors the existing implementation in `src/pages/admin/Bookings.tsx`.
