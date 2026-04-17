ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS total_units integer NOT NULL DEFAULT 1;

-- Backfill total_units from existing room_numbers array length where applicable
UPDATE public.rooms
SET total_units = GREATEST(array_length(room_numbers, 1), 1)
WHERE array_length(room_numbers, 1) IS NOT NULL;