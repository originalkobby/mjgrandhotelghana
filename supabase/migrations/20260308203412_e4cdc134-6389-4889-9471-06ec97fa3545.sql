-- Allow anyone to look up a booking by reference (permissive SELECT)
CREATE POLICY "Public can lookup bookings"
ON public.bookings
FOR SELECT
USING (true);