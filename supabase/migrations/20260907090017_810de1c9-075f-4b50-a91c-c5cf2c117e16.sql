REVOKE ALL ON FUNCTION public.is_delivery_ops(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_delivery_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_rider_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_delivery_ops(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_delivery_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_rider_id() TO authenticated, service_role;