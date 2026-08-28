# Food Delivery for Restaurant Orders

Add off-site delivery alongside the existing room service option, with admin-managed delivery zones, zone fees, and an "Out for delivery" fulfilment step for staff.

## What guests get

- A fourth order type on `/food-order`: **Delivery** (in addition to Dine-in, Room Service, Takeaway).
- When Delivery is chosen:
  - Guest picks a **delivery zone** from a dropdown of active zones (each shows its fee).
  - **Delivery address** and **phone** become required.
  - Optional landmark / directions field.
  - The order summary shows: items subtotal + delivery fee = total.
- Room Service stays exactly as it is (in-hotel, room number, no fee).
- The confirmation screen and confirmation email both show the zone, address and delivery fee line.

## What staff get

- New status step: **Pending → Confirmed → Ready → Out for delivery → Completed** (Cancelled still available at any point). "Out for delivery" only appears for delivery orders; other types keep the current progression.
- Delivery orders on `/admin/food-orders` show the zone as a badge, and the detail dialog shows address, landmark, phone, zone and fee.
- New filter option for order type "Delivery", and a quick filter for "Out for delivery".
- New **Delivery Zones** section in admin Settings: add / edit / deactivate zones (name + fee in GH₵). Restricted to `admin` and `operations_manager`.

## Technical details

### Database (single migration)

- New table `public.delivery_zones`: `name`, `fee_ghs`, `is_active`, `sort_order`, timestamps.
  - Grants: `SELECT` to `anon` and `authenticated` (needed for the public order form); full access to `service_role`; insert/update/delete for `admin` and `operations_manager` via `has_role`.
  - RLS: public read of active zones, staff-only writes.
  - `updated_at` trigger.
- Alter `public.food_orders`:
  - add `delivery_zone_id uuid` (nullable, references `delivery_zones`)
  - add `delivery_address text`, `delivery_landmark text`, `delivery_fee_ghs numeric not null default 0`
  - add `'delivery'` to the `order_type` enum
  - add `'out_for_delivery'` to the `order_status` enum
- Seed a starter set of zones (East Legon, Airport City, Cantonments, Osu, Spintex) with editable fees via a data insert.

### Frontend

- `src/pages/FoodOrder.tsx` — add Delivery to the order-type selector, fetch active zones, conditional required fields, include `delivery_fee_ghs` in `total_ghs`, and persist the new columns.
- `src/pages/admin/FoodOrders.tsx` — extend `STATUS_SEQUENCE` / labels / colours with `out_for_delivery`, make `nextStatus` branch on `order_type`, add the Delivery type filter, and render delivery details in the table row and dialog.
- `src/pages/admin/Settings.tsx` — new Delivery Zones tab with inline add/edit/toggle, role-gated.
- `supabase/functions/send-food-order-email/index.ts` — include delivery zone, address and fee line in the email body.

## Out of scope

- Driver assignment / live tracking.
- Distance-based or map-calculated fees.
- Online payment for delivery (still pay on delivery).
