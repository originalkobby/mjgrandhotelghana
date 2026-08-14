ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS group_ref text,
  ADD COLUMN IF NOT EXISTS group_size integer;

CREATE INDEX IF NOT EXISTS bookings_group_ref_idx ON public.bookings (group_ref) WHERE group_ref IS NOT NULL;