# Change Operations Manager login email

Goal: the Operations Manager signs in with `op.mj@mjgrandhotelghana.com` instead of `op@mjgrandhotelghana.com`, keeping the same account, role and history.

## What needs to happen

The email lives on the Supabase authentication account, not in the app's own tables. A search of the codebase confirms the old address is not hardcoded anywhere, so no code changes are needed.

The role assignment is linked to the account's internal user ID (not the email), so changing the email keeps the `operations_manager` access intact automatically.

## Steps

1. Open the Supabase Users page for the project.
2. Find the user `op@mjgrandhotelghana.com`, open it, and update the email to `op.mj@mjgrandhotelghana.com` (also mark it confirmed so no re-verification is required).
3. Optionally reset the password if the user wants a fresh one.
4. Verify by signing in at `/admin/login` with the new address and confirming the sidebar shows the Operations Manager navigation.

## Notes

- Auth accounts cannot be edited through database migrations (the `auth` schema is Supabase-managed), so this is done from the dashboard.
- If you would rather I automate it, the alternative is a one-off admin edge function using the service role key to update the user — more moving parts for a single change, so the dashboard route is recommended.
