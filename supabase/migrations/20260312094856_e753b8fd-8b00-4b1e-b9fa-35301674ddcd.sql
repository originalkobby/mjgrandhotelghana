
-- Add booking_source column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_source text NOT NULL DEFAULT 'direct';

-- Add ota_reference column to store the OTA's own booking ID
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS ota_reference text;

-- Create index for OTA reference lookups
CREATE INDEX IF NOT EXISTS idx_bookings_ota_reference ON public.bookings(ota_reference) WHERE ota_reference IS NOT NULL;

-- Create index for booking source filtering
CREATE INDEX IF NOT EXISTS idx_bookings_booking_source ON public.bookings(booking_source);

-- Create webhook_logs table for auditing
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  source text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  booking_id uuid REFERENCES public.bookings(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view webhook logs
CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Edge functions can insert logs (via service role, no RLS check needed for service role)
CREATE POLICY "Service can insert webhook logs" ON public.webhook_logs
FOR INSERT TO anon, authenticated
WITH CHECK (true);
