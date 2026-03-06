
-- Grant table-level permissions to anon and authenticated roles
GRANT SELECT, INSERT ON public.bookings TO anon, authenticated;
GRANT SELECT, INSERT ON public.booking_add_ons TO anon, authenticated;
GRANT SELECT, INSERT ON public.guests TO anon, authenticated;
GRANT SELECT, INSERT ON public.payment_logs TO anon, authenticated;
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT SELECT ON public.room_inventory TO anon, authenticated;
GRANT SELECT ON public.add_ons TO anon, authenticated;
GRANT SELECT ON public.cancellation_policies TO anon, authenticated;
GRANT SELECT ON public.seasonal_pricing TO anon, authenticated;
GRANT SELECT ON public.promotions TO anon, authenticated;

-- Admin roles need full access to bookings
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.booking_add_ons TO authenticated;
