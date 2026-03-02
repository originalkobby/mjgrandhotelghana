
-- Fix user_roles RLS - only admins can view/manage roles
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fix generate_booking_ref search path
CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'MJ-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));
  RETURN ref;
END;
$$;
