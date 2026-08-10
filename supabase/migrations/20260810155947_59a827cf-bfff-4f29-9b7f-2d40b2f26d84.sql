
-- booking_add_ons
ALTER POLICY "Admins can view booking add-ons" ON public.booking_add_ons
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));

-- booking_audit_log
ALTER POLICY "Admins can insert audit logs" ON public.booking_audit_log
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Admins can view audit logs" ON public.booking_audit_log
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'revenue_manager') OR has_role(auth.uid(),'operations_manager'));

-- bookings
ALTER POLICY "Admins can view all bookings" ON public.bookings
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revenue_manager') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Admins can manage bookings" ON public.bookings
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Staff can unlink booking guests" ON public.bookings
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));

-- contact_messages
ALTER POLICY "Admins can view messages" ON public.contact_messages
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Admins can update messages" ON public.contact_messages
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));

-- conversations
ALTER POLICY "Staff can view conversations" ON public.conversations
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Public can insert conversations" ON public.conversations
  WITH CHECK ((guest_id IS NULL) OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Staff can unlink conversation guests" ON public.conversations
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));

-- guests
ALTER POLICY "Staff can view guests" ON public.guests
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Staff can update guests" ON public.guests
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));

-- promotions (read-only visibility)
ALTER POLICY "Front desk can view promos" ON public.promotions
  USING (has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));

-- room_inventory
ALTER POLICY "Staff can view inventory" ON public.room_inventory
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'revenue_manager') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Admins can manage inventory" ON public.room_inventory
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operations_manager'));

-- rooms
ALTER POLICY "Admins can manage rooms" ON public.rooms
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operations_manager'));

-- support_tickets
ALTER POLICY "Staff can view support tickets" ON public.support_tickets
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Staff can update support tickets" ON public.support_tickets
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Staff can unlink support ticket guests" ON public.support_tickets
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));
ALTER POLICY "Public can insert support tickets" ON public.support_tickets
  WITH CHECK ((guest_id IS NULL) OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'front_desk') OR has_role(auth.uid(),'operations_manager'));

-- role priority for the admin UI
CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role::text
    WHEN 'admin' THEN 1
    WHEN 'operations_manager' THEN 2
    WHEN 'revenue_manager' THEN 3
    WHEN 'front_desk' THEN 4
    WHEN 'finance' THEN 5
    ELSE 6
  END
  LIMIT 1
$function$;
