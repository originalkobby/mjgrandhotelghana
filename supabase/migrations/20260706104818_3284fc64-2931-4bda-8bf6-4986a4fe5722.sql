-- 1) Reinforce column-level restriction on rooms.room_numbers ------------------
-- Baseline: revoke SELECT on the sensitive column from anon/authenticated so the
-- Data API cannot return it even if the row is otherwise visible via RLS.
REVOKE SELECT (room_numbers) ON public.rooms FROM anon, authenticated, PUBLIC;

-- Event trigger safeguard: if a future migration ever re-grants SELECT on the
-- rooms table without excluding room_numbers, immediately revoke that column
-- back from anon and authenticated. This makes the invariant self-healing.
CREATE OR REPLACE FUNCTION public.enforce_rooms_room_numbers_private()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('GRANT', 'ALTER TABLE', 'ALTER DEFAULT PRIVILEGES', 'CREATE TABLE')
  LOOP
    IF has_column_privilege('anon', 'public.rooms', 'room_numbers', 'SELECT')
       OR has_column_privilege('authenticated', 'public.rooms', 'room_numbers', 'SELECT') THEN
      EXECUTE 'REVOKE SELECT (room_numbers) ON public.rooms FROM anon, authenticated, PUBLIC';
      RAISE LOG 'enforce_rooms_room_numbers_private: re-revoked SELECT on rooms.room_numbers';
    END IF;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  -- Never break DDL if the check fails for any reason.
  NULL;
END;
$$;

DROP EVENT TRIGGER IF EXISTS enforce_rooms_room_numbers_private_trg;
CREATE EVENT TRIGGER enforce_rooms_room_numbers_private_trg
  ON ddl_command_end
  EXECUTE FUNCTION public.enforce_rooms_room_numbers_private();

-- 2) Remove EXECUTE on SECURITY DEFINER helpers that are NOT called from client
-- or from RLS policies. `has_role` intentionally stays callable because RLS
-- policies invoke it with the querying role's privileges.
REVOKE EXECUTE ON FUNCTION public.generate_booking_ref() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_admin_role() FROM PUBLIC, anon, authenticated;
