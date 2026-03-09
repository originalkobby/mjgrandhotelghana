ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pay_at_hotel';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS actual_check_in timestamptz DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS actual_check_out timestamptz DEFAULT NULL;