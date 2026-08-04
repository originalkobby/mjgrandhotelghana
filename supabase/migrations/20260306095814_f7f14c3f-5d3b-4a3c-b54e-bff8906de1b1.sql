
-- Force PostgREST schema cache reload by notifying
NOTIFY pgrst, 'reload schema';

-- Also ensure the usage grant on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
