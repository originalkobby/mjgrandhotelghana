-- 1. Trigger function to sync room_inventory.total_count when rooms.total_units changes
CREATE OR REPLACE FUNCTION public.sync_inventory_total_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.total_units IS DISTINCT FROM OLD.total_units THEN
    UPDATE public.room_inventory
    SET total_count = NEW.total_units
    WHERE room_id = NEW.id AND date >= CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Trigger on rooms table
DROP TRIGGER IF EXISTS rooms_sync_inventory ON public.rooms;
CREATE TRIGGER rooms_sync_inventory
AFTER UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_total_count();

-- 3. One-time backfill: align existing future inventory with current rooms.total_units
UPDATE public.room_inventory ri
SET total_count = r.total_units
FROM public.rooms r
WHERE ri.room_id = r.id
  AND ri.date >= CURRENT_DATE
  AND ri.total_count IS DISTINCT FROM r.total_units;