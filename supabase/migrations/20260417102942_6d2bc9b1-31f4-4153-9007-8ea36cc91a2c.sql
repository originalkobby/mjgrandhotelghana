ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS room_numbers text[] NOT NULL DEFAULT '{}'::text[];