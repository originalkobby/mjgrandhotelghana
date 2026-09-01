# Admin-only password management

Password changes become an admin-only capability. Non-admin staff (operations manager, front desk, finance, revenue manager, restaurant staff) lose the self-service change-password form; only an admin can set a password — their own or any other staff account's.

## What changes

1. **Remove self-service password change for non-admins**
   - The Change Password card is no longer shown to non-admin roles.
   - Restaurant staff's Settings page becomes empty of password controls, so the Settings item is removed from their sidebar and they go back to being restricted to Food Orders only.

2. **New "Account Passwords" card in Settings, visible to admins only**
   - Lists all staff accounts (email + role).
   - Each row has a "Set Password" action opening a dialog with New Password / Confirm New Password (min 8 characters, show/hide toggle).
   - An admin can select their own account in the same list to change their own password.
   - Success and error feedback via toasts.

3. **Server-side enforcement**
   - A new edge function performs the password update using the service role, after verifying the caller's JWT belongs to a user holding the `admin` role. Non-admin callers are rejected, so the restriction cannot be bypassed from the browser.
   - The same function returns the staff account list (email, role, id) for admins.

## Technical notes

- New edge function `admin-users` with two actions: `list` and `set_password`. It reads the caller's bearer token, resolves the user, checks `public.has_role(uid, 'admin')` (or the `user_roles` table) with the service role client, then calls `auth.admin.updateUserById` / `auth.admin.listUsers`.
- `src/components/admin/ChangePasswordCard.tsx` is replaced by `src/components/admin/AccountPasswordsCard.tsx` (admin-only), invoked via `supabase.functions.invoke`.
- `src/pages/admin/Settings.tsx`: drop the `staffOnly` password branch; render the new card only when `role === "admin"`.
- `src/components/admin/AdminSidebar.tsx`: remove `restaurant_staff` from the Settings nav item roles.
- `src/pages/admin/AdminLayout.tsx`: revert the Settings exception for restaurant staff.
- No database migration required.
