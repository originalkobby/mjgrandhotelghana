CREATE OR REPLACE FUNCTION public.sync_rider_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.delivery_riders
  SET last_lat = NEW.lat,
      last_lng = NEW.lng,
      last_location_at = NEW.recorded_at
  WHERE id = NEW.rider_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_rider_location ON public.rider_locations;
CREATE TRIGGER trg_sync_rider_location
AFTER INSERT ON public.rider_locations
FOR EACH ROW
EXECUTE FUNCTION public.sync_rider_location();