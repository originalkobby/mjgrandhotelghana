
-- 1) Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated.
--    has_role is still callable from RLS expressions (runs as table owner).
--    Trigger functions don't need EXECUTE grants to client roles.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_booking_ref() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_inventory_total_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_inventory_rate_on_base_change() FROM PUBLIC, anon, authenticated;

-- 2) Lock down guests inserts. All guest creation happens server-side via edge
--    functions using the service role, which bypasses RLS.
DROP POLICY IF EXISTS "Public can insert guests" ON public.guests;

-- 3) room_inventory: stop leaking confidential operational fields (rate_override,
--    closure_reason). Expose only availability-relevant columns through a view.
DROP POLICY IF EXISTS "Public can view inventory" ON public.room_inventory;

CREATE POLICY "Staff can view inventory"
ON public.room_inventory
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'front_desk'::public.app_role)
  OR public.has_role(auth.uid(), 'revenue_manager'::public.app_role)
);

CREATE OR REPLACE VIEW public.room_availability
WITH (security_invoker = true) AS
SELECT room_id, date, total_count, booked_count, is_closed, min_stay
FROM public.room_inventory;

GRANT SELECT ON public.room_availability TO anon, authenticated;

-- 4) Realtime: restrict channel subscriptions to staff via realtime.messages RLS.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read realtime messages" ON realtime.messages;
CREATE POLICY "Staff can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'front_desk'::public.app_role)
  OR public.has_role(auth.uid(), 'revenue_manager'::public.app_role)
  OR public.has_role(auth.uid(), 'finance'::public.app_role)
);
