# Ready for pick-up doesn't start the rider dispatch

## What's actually happening

Order FO-MJ-IWPB is marked **Ready for pick-up** on the Food Orders screen, but its delivery record is still sitting at **Confirmed**, dispatch state "idle", with no rider offers made.

The two screens write to two different places:

- Food Orders: changes only the order's own status. Nothing else is told.
- Deliveries board: changes the delivery status, and *that* is the only path that wakes the dispatch engine.

So the kitchen marking food ready never reaches the dispatch engine. Everything else is fine: auto-dispatch is switched on and two riders are active and free.

## The fix

Make the Food Orders status buttons drive the delivery, instead of writing the order status directly.

When staff advance a **delivery** order on the Food Orders screen:

- Confirmed -> the delivery moves to "Preparing"
- Ready for pick-up -> the delivery moves to "Ready for pick-up", which fires the automatic rider offer
- On the way / Completed -> mapped to the matching delivery step

The order status keeps updating exactly as today, so nothing on screen changes for staff, and dine-in, room-service and takeaway orders are untouched.

Also included:
- A one-time catch-up so the order already stuck at Ready gets dispatched once the fix is live.
- The Deliveries board's existing periodic sweep already picks up anything ready but unoffered, so a missed trigger self-corrects within a minute.

## Technical detail

- `supabase/functions/delivery-action/index.ts` already syncs the food order status when a delivery advances (`ready_for_pickup -> ready` map at line 291) and calls `dispatch-rider` on `ready_for_pickup`. That is the authoritative path.
- `src/pages/admin/FoodOrders.tsx` `updateStatus()` writes `food_orders.status` directly. Change it so that when `order.order_type === "delivery"` and a delivery row exists for the order, it invokes `delivery-action` with the mapped delivery status instead, and lets that function update the food order. Fall back to the current direct write if no delivery row exists or the call fails, with a clear toast.
- Mapping used: `confirmed -> preparing`, `ready -> ready_for_pickup`, `out_for_delivery -> on_the_way`, `completed -> delivered`, `cancelled -> cancelled`. Transitions are validated server-side by the existing `DELIVERY_TRANSITIONS` table, so invalid jumps are refused rather than corrupting state.
- Fetch each order's `deliveries(id, status)` in the existing orders query so the page knows the current delivery step.
- Catch-up: after deploying, run the existing `dispatch-rider` `sweep` action once for the stuck delivery (the Deliveries board already invokes it on load).

No database migration is required.
