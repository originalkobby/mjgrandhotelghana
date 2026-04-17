
The user wants the same auto-sync behavior we set up for `total_units` → `room_inventory.total_count` to also apply to room **rates**: when a room's `base_price_ghs` changes in `/admin/rooms`, the inventory grid and public booking engine should reflect the new rate.

## Current state
- `rooms.base_price_ghs` is the canonical rate per room type.
- `room_inventory.rate_override` is a per-date override (nullable). When NULL, the booking flow falls back to `base_price_ghs`.
- The dynamic-pricing engine writes computed `rate_override` values per date.
- Editing `base_price_ghs` today does NOT touch existing inventory rows, so future dates keep stale `rate_override` values from the last pricing run.

## The fix

### 1. Database trigger — propagate base price changes
Extend the existing `sync_inventory_total_count()` pattern with a second trigger on `rooms` that fires when `base_price_ghs` changes. It will **clear** `rate_override` (set to NULL) for all future inventory rows for that room, so the booking flow falls back to the new base price immediately.

```sql
CREATE OR REPLACE FUNCTION sync_inventory_rate_on_base_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.base_price_ghs IS DISTINCT FROM OLD.base_price_ghs THEN
    UPDATE room_inventory
    SET rate_override = NULL
    WHERE room_id = NEW.id AND date >= CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

Why clear instead of overwrite? `rate_override` exists specifically as a per-date override layer. Setting it to NULL means "use the room's base price," which is exactly the desired behavior after a base-price change. Admins or the dynamic-pricing engine can then re-set per-date overrides as needed.

### 2. Auto re-run dynamic pricing
After clearing overrides, immediately invoke the `dynamic-pricing` edge function from `src/pages/admin/Rooms.tsx` after a successful save. This regenerates seasonal/occupancy/day-of-week adjusted rates against the new base price for the next 90 days. Show a subtle toast: "Inventory rates re-synced."

### 3. Booking flow already works
- `RoomSelectionStep` and `create-booking` already use `rate_override ?? base_price_ghs`, so clearing overrides immediately makes new rates live.
- `Inventory.tsx` already displays `rate_override || base_price_ghs` per cell.

### 4. Helper hint in Inventory edit dialog
Add a one-liner under the "Rate Override" field: "Leave blank to use the room type's base price (GH₵ X)."

## No changes needed
- Database schema (no new columns).
- `create-booking` edge function (already falls back correctly).
- `RoomSelectionStep` (already falls back correctly).

## Result
Editing a room's base price in `/admin/rooms` instantly:
1. Clears stale per-date rate overrides for that room.
2. Triggers a dynamic-pricing run to recompute fresh rates from the new base.
3. Public booking engine and inventory grid show the new rates immediately.
