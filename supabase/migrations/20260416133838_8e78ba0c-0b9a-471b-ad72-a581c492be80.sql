
-- 1. Remove public INSERT on bookings (edge function uses service role key)
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;

-- 2. Remove public INSERT on booking_add_ons (edge function uses service role key)
DROP POLICY IF EXISTS "Public can insert booking add-ons" ON public.booking_add_ons;

-- 3. Remove anon INSERT on webhook_logs (edge function uses service role key)
DROP POLICY IF EXISTS "Service can insert webhook logs" ON public.webhook_logs;

-- 4. Restrict payment_logs INSERT to admin/finance roles only
DROP POLICY IF EXISTS "Authenticated can insert payment logs" ON public.payment_logs;
CREATE POLICY "Staff can insert payment logs"
ON public.payment_logs
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'finance'::app_role)
);
