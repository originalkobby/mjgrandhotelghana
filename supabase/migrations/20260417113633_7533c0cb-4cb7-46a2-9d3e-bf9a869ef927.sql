UPDATE public.room_inventory
SET rate_override = NULL
WHERE date >= CURRENT_DATE
  AND rate_override IS NOT NULL;