-- Ensure column-level grant is revoked from anon for rooms.room_numbers
REVOKE SELECT (room_numbers) ON public.rooms FROM anon;
REVOKE SELECT (room_numbers) ON public.rooms FROM PUBLIC;

-- conversations: tighten INSERT WITH CHECK so non-staff cannot set guest_id to arbitrary value
DROP POLICY IF EXISTS "Public can insert conversations" ON public.conversations;
CREATE POLICY "Public can insert conversations"
ON public.conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  guest_id IS NULL
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'front_desk'::app_role)
);

-- support_tickets: tighten INSERT WITH CHECK similarly
DROP POLICY IF EXISTS "Public can insert support tickets" ON public.support_tickets;
CREATE POLICY "Public can insert support tickets"
ON public.support_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (
  guest_id IS NULL
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'front_desk'::app_role)
);