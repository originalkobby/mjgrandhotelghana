ALTER TABLE public.food_orders
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatch_email_sent_at timestamptz;