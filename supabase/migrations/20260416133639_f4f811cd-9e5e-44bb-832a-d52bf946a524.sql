
-- Remove anon INSERT on revenue_forecasts (service role key bypasses RLS anyway)
DROP POLICY IF EXISTS "Service can insert forecasts" ON public.revenue_forecasts;

-- Remove anon INSERT on demand_alerts
DROP POLICY IF EXISTS "Service can insert alerts" ON public.demand_alerts;

-- Remove anon INSERT on revenue_streams
DROP POLICY IF EXISTS "Service can insert revenue streams" ON public.revenue_streams;
