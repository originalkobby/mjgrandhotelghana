-- Trigger-only functions: nobody should be able to call these directly.
REVOKE EXECUTE ON FUNCTION public.sync_rider_location() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_earning_adjustment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_booking_ref() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_inventory_rate_on_base_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_inventory_total_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_rooms_room_numbers_private() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Helper functions used only inside RLS policies for signed-in users:
-- remove direct execute from anon and PUBLIC, keep authenticated where policies need them.
REVOKE EXECUTE ON FUNCTION public.current_rider_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_admin_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_delivery_ops(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_delivery_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rider_has_open_offer(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_rider_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_delivery_ops(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_delivery_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rider_has_open_offer(uuid) TO authenticated;

-- has_role() is intentionally left callable: public pages (delivery zones,
-- contact messages) evaluate RLS policies that call it as the anon role.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
