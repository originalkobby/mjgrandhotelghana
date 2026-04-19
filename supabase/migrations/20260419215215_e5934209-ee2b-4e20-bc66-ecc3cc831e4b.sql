ALTER TABLE public.room_inventory
ADD COLUMN IF NOT EXISTS closure_reason text;