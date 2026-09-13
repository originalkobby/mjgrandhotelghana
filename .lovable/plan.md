# Capture customer details on first "Order Now"

## Goal
The first time someone uses a device to order from the menu, ask for Name, Email and Phone before sending them to the order page. After that, the same device goes straight through. Staff can see and export these captured customers in the dashboard.

## How it works for the customer
1. Customer taps "ORDER NOW" on a menu card (full sections and compact sections).
2. If this device has not been registered before, a short pop-up appears asking for Name, Email and Phone, with a Continue button.
3. On Continue, the details are saved and the customer lands on the food order page with the item, price and their details already filled in.
4. Every later tap of "ORDER NOW" on that device skips the pop-up entirely.
5. The same happens if someone opens the order page directly without going through the menu, so details are never missed.

## What staff see
- A new "Customers" tab on the Food Orders page (admin, operations manager and restaurant staff), listing name, email, phone, when first captured, when last seen, and number of visits.
- Search box and an "Export CSV" button, matching the styling of the existing tables (sticky headings, zebra rows, in-table scroll).
- Admin-only delete for individual rows, in line with other sections.

## Technical notes
- New table `public.food_customers`: `id`, `full_name`, `email`, `phone`, `device_id` (unique), `visit_count`, `first_seen_at`, `last_seen_at`, `created_at`, `updated_at`, with the standard updated-at trigger.
  - Grants: insert/update to `anon` and `authenticated` (public ordering flow), select/delete limited to staff via existing role helpers; `ALL` to `service_role`.
  - RLS: anonymous visitors may insert their own row and update only the row matching their device id; reads restricted to `is_delivery_staff()`; delete restricted to `has_role(auth.uid(),'admin')`.
- Device identity: a random UUID stored in `localStorage` under `mj_food_device_id`, alongside a cached copy of the name/email/phone so the prefill works offline and without a round trip.
- New component `src/components/food/CustomerDetailsDialog.tsx` with zod validation (name 1-100, valid email, Ghana-friendly phone 7-20 chars) and an upsert on `device_id` that also bumps `visit_count` and `last_seen_at`.
- `src/components/MenuSection.tsx` and the compact cards in `src/pages/Menu.tsx`: intercept the card click when no device record exists, show the dialog, then navigate to the same `/food-order` URL they already build.
- `src/pages/FoodOrder.tsx`: prefill name/email/phone from the cached details; show the same dialog once if a device has no record.
- New `src/components/admin/FoodCustomersPanel.tsx` rendered as a tab in `src/pages/admin/FoodOrders.tsx`, reusing the existing table styling and CSV export helper pattern.

## Out of scope
- No change to order placement, pricing, delivery or email flows.
- No login or account system; this is a lightweight device-level identification only.
