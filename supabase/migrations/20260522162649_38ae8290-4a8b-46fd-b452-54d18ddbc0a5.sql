-- Restore EXECUTE on has_role to authenticated/anon; it is the designated RLS helper
-- (SECURITY DEFINER with locked search_path). Revoking it broke admin login because
-- RLS policies on user_roles call has_role() as the querying user.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- generate_booking_ref is invoked from client-side booking flows; restore it.
GRANT EXECUTE ON FUNCTION public.generate_booking_ref() TO authenticated, anon;