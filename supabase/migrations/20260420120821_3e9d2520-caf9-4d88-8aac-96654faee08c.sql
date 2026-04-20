-- Allow admins to delete bookings
CREATE POLICY "Admins can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete related booking add-ons
CREATE POLICY "Admins can delete booking add-ons"
ON public.booking_add_ons
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete related audit logs
CREATE POLICY "Admins can delete audit logs"
ON public.booking_audit_log
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete related payment logs
CREATE POLICY "Admins can delete payment logs"
ON public.payment_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));