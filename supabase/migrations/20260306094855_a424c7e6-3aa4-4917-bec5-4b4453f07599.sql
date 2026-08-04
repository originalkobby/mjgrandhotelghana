
-- Drop restrictive public insert policies and recreate as permissive

-- bookings: fix public insert
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- booking_add_ons: fix public insert
DROP POLICY IF EXISTS "Public can insert booking add-ons" ON public.booking_add_ons;
CREATE POLICY "Public can insert booking add-ons"
ON public.booking_add_ons
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- guests: fix public insert and select
DROP POLICY IF EXISTS "Public can insert guests" ON public.guests;
CREATE POLICY "Public can insert guests"
ON public.guests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can select guests by email" ON public.guests;
CREATE POLICY "Public can select guests by email"
ON public.guests
FOR SELECT
TO anon, authenticated
USING (true);
