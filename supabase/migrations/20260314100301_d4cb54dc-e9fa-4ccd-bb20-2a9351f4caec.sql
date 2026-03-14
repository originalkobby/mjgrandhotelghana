
-- Add room_number to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_number text DEFAULT NULL;

-- Add room_number to support_tickets table
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS room_number text DEFAULT NULL;
