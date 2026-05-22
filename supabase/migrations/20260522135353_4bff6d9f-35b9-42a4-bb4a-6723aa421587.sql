
-- 1. conversations: prevent anon from spoofing guest_id
DROP POLICY IF EXISTS "Public can insert conversations" ON public.conversations;
CREATE POLICY "Public can insert conversations"
ON public.conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND guest_id IS NULL)
  OR auth.uid() IS NOT NULL
);

-- 2. support_tickets: prevent anon from spoofing guest_id
DROP POLICY IF EXISTS "Public can insert support tickets" ON public.support_tickets;
CREATE POLICY "Public can insert support tickets"
ON public.support_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND guest_id IS NULL)
  OR auth.uid() IS NOT NULL
);

-- 3. rooms: hide internal room_numbers from anonymous public visitors
REVOKE SELECT (room_numbers) ON public.rooms FROM anon;
