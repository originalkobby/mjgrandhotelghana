# Food Ordering Engine + Staff Dashboard

## Goal
Turn the existing public menu into a click-to-order experience, and add a professional staff dashboard where restaurant and front-desk teams can view, filter, and manage incoming food orders in real time.

## Scope

### 1. Remove stray Settings icon
- In `src/pages/admin/Settings.tsx` remove the unused `<Settings2>` SVG that currently sits beside the "Settings" heading.

### 2. Make menu items clickable (public)
- Update `src/components/MenuSection.tsx` and `src/pages/Menu.tsx` so each dish card is a link to `/food-order` with query params `item`, `price`, and optional `category`.
- Preserve current hover/animation styling; add a visible "Order" affordance.

### 3. New public food-order page
- Route: `/food-order`.
- Pre-fills the selected dish name and price from query parameters.
- Lets the guest add quantity, choose order type (Dine-in / Room Service / Takeaway), enter room number (optional), name, email, phone, and notes.
- Shows a live running total.
- Submits the order to Supabase and shows a confirmation with an order reference.
- No online payment in this phase; orders are "Pay at collection / on delivery".

### 4. Database schema
New tables (added via migration):

- `food_orders`
  - `guest_name`, `email`, `phone`, `room_number` (optional)
  - `order_type` enum: `dine_in`, `room_service`, `takeaway`
  - `status` enum: `pending`, `confirmed`, `ready`, `completed`, `cancelled`
  - `notes`, `total_ghs`, `reference_code`
  - `created_at`, `updated_at`
- `food_order_items`
  - `food_order_id`, `menu_item_id` (optional), `name`, `price_ghs`, `quantity`, `line_total_ghs`

RLS:
- Anonymous and authenticated guests can INSERT only.
- Authenticated staff (`admin`, `operations_manager`, `front_desk`) can SELECT / UPDATE all rows.
- A trigger auto-updates `updated_at`.

### 5. Staff dashboard page
- Route: `/admin/food-orders`.
- Real-time Supabase subscription so new orders appear without refresh.
- Table with: reference, status, customer, type, items summary, total, time, actions.
- Filters by status and order type; search by name/reference.
- Inline status update (Pending → Confirmed → Ready → Completed, plus Cancelled).
- Detail drawer/modal showing full order contents and guest notes.
- Added to `AdminSidebar` and gated to `admin`, `operations_manager`, `front_desk`.

### 6. Navigation / routing
- `src/App.tsx`: add `/food-order` public route and `/admin/food-orders` admin route.
- `src/components/admin/AdminSidebar.tsx`: add "Food Orders" nav item.

### 7. Real-time and types
- Enable realtime on `food_orders` and `food_order_items` via migration.
- Regenerated Supabase types will be used automatically.

## Out of scope
- Online payment for food orders.
- Kitchen printer / POS integration.
- SMS/push staff notifications (orders appear in the dashboard via realtime).

## Technical details
- Reuse existing UI kit (`Card`, `Table`, `Badge`, `Dialog`, `Button`, `Input`, `Select`, `Skeleton`).
- Follow dark charcoal/gold theme used in the rest of the dashboard.
- Mirror the zebra-stripe sticky-table pattern from `/admin/menu` and `/admin/bookings`.
- Validate numeric price parsing; strip currency symbols before storing.
- Generate a short reference code (e.g., `FO-MJ-XXXX`) for each order.
