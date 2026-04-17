
The user wants the inventory section (`/admin/inventory`) to automatically reflect the `total_units` value set on each room type in the Rooms admin page. Currently, `room_inventory.total_count` is set per row (per room×date), defaulting to 1, and is edited manually in the Inventory dialog. This creates a disconnect: setting "Total Rooms = 5" on a room type doesn't propagate to the inventory grid.

## Goal
When a room's `total_units` changes (or a new room is created), all `room_inventory` rows for that room should reflect this as their `total_count`. New inventory rows created by the dynamic pricing engine or on-the-fly bookings should also use `total_units` as their default.

## Plan

### 1. Database trigger — auto-sync `total_count` from `rooms.total_units`
Add a Postgres trigger on `rooms` (AFTER UPDATE OF total_units): when `total_units` changes, update all `room_inventory` rows for that room where `date >= today` to set `total_count = NEW.total_units`. Past dates are left untouched to preserve historical accuracy.

```sql
CREATE OR REPLACE FUNCTION sync_inventory_total_count()
RETURNS trigger AS $$
BEGIN
  IF NEW.total_units IS DISTINCT FROM OLD.total_units THEN
    UPDATE room_inventory
    SET total_count = NEW.total_units
    WHERE room_id = NEW.id AND date >= CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER rooms_sync_inventory
AFTER UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION sync_inventory_total_count();
```

### 2. One-time backfill
Update existing `room_inventory` rows (date >= today) so `total_count = rooms.total_units` for each room. This brings current inventory in sync with the values just configured.

### 3. Dynamic pricing edge function — use `total_units` as default
In `supabase/functions/dynamic-pricing/index.ts`, when inserting new `room_inventory` rows, set `total_count` to the room's `total_units` instead of the hard-coded default (1).

### 4. Inventory admin UI — read-only `total_count` with hint
In `src/pages/admin/Inventory.tsx`, the "Total Rooms" input in the edit dialog stays editable for one-off date overrides (e.g., closing 2 of 5 rooms for maintenance on a specific date), but add a small helper text under the field: "Default comes from the room type's Total Rooms setting. Change here only for date-specific overrides."

### No changes needed
- `create-booking` already increments `booked_count` against existing inventory rows.
- `RoomSelectionStep` reads `total_count - booked_count` directly, so it picks up changes automatically.

### Result
Editing "Total Rooms" on a room type instantly updates all future inventory rows for that room, keeping the Inventory grid, public availability, and the booking engine in sync.
