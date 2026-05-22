CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role::text
    WHEN 'admin' THEN 1
    WHEN 'revenue_manager' THEN 2
    WHEN 'front_desk' THEN 3
    WHEN 'finance' THEN 4
    ELSE 5
  END
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_my_admin_role() TO authenticated;