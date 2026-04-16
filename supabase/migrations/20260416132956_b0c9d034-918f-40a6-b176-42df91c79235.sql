
-- 1. Remove public SELECT on revenue_forecasts (internal business data)
DROP POLICY IF EXISTS "Public can view forecasts" ON public.revenue_forecasts;

-- 2. Restrict payment_logs INSERT to authenticated users only (was public/anon with no checks)
DROP POLICY IF EXISTS "Public can insert payment logs" ON public.payment_logs;
CREATE POLICY "Authenticated can insert payment logs"
ON public.payment_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
