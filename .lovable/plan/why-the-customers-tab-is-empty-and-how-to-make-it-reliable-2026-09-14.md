# Why the Customers tab is empty, and how to make it reliable

## What the checks show

- The `food_customers` table has zero rows, and its access rules and permissions are correct (anonymous visitors can register a device, staff can read).
- The most recent food order was placed on 13/09/2026 at 19:57, before the customer-capture form existed. Every other order is older.
- So nothing has been captured because no order has gone through the new form yet — not because the capture is broken.

There is still a real gap: details are only saved when the pop-up form is shown. Anyone whose device already has details cached, or who reaches the order page another way, never lands in the Customers list. The list should reflect everyone who actually ordered.

## What to change

1. **Capture on order placement (source of truth)**
   In the order-placing edge function (`place-food-order`), after an order is saved, record or refresh the customer using the name, email and phone submitted with the order. Match on email (lowercased) when there is no device match, so repeat customers increase their visit count instead of duplicating.

2. **Backfill past orders**
   One-off migration that fills `food_customers` from existing `food_orders` (grouped by email): name and phone from the most recent order, `first_seen_at` from the earliest, `last_seen_at` from the latest, `visit_count` = number of orders. Existing rows are updated, not duplicated.

3. **Keep the device form as-is**
   The first-time pop-up keeps working exactly as now for pre-filling; it simply stops being the only way a customer gets recorded.

4. **Small dashboard touch**
   Show a "Source" column (Device form / Order) in the Customers tab so staff can tell how a record arrived, and include it in the CSV export.

## Technical notes

- Migration: allow `device_id` to be null (orders without a device), add a unique index on `lower(email)`, add a nullable `source text` column defaulting to `device`, keep existing grants and policies; capture from the edge function runs with the service role, so no policy change is needed for writes.
- `supabase/functions/place-food-order/index.ts`: after the order insert, upsert into `food_customers` on the email key, bumping `visit_count` and `last_seen_at`. Failures are logged and never block an order.
- `src/lib/customerDevice.ts`: unchanged behaviour, but the upsert conflict target stays `device_id`.
- `src/components/admin/FoodCustomersPanel.tsx`: add the Source column and CSV field.

## Out of scope

- No change to pricing, delivery, dispatch or email flows.
- No accounts or login for customers.
