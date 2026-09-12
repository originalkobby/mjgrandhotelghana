REVOKE ALL ON FUNCTION public.apply_earning_adjustment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_rider_earning() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_rider_payout() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;