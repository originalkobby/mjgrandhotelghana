-- Trigger function: clear stale rate_override when a room's base price changes
CREATE OR REPLACE FUNCTION public.sync_inventory_rate_on_base_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.base_price_ghs IS DISTINCT FROM OLD.base_price_ghs THEN
    UPDATE public.room_inventory
    SET rate_override = NULL
    WHERE room_id = NEW.id AND date >= CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rooms_sync_inventory_rate ON public.rooms;
CREATE TRIGGER rooms_sync_inventory_rate
AFTER UPDATE OF base_price_ghs ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_rate_on_base_change();