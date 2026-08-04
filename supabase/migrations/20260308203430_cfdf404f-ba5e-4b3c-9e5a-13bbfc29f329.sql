-- Allow public to update booking status for cancellation
CREATE POLICY "Public can cancel bookings"
ON public.bookings
FOR UPDATE
USING (status = 'confirmed' OR status = 'pending')
WITH CHECK (status = 'cancelled');