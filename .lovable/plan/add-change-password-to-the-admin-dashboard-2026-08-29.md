# Add "Change Password" to the admin dashboard

Right now there is no way for a signed-in staff member (like the new `f&b@mjgrandhotelghana.com` account) to change their password — no reset email, no settings option. This plan adds a self-service change-password feature.

## What changes

1. **Change Password section in the dashboard** — added to the admin Settings page (`/admin/settings`), visible to every signed-in staff role (admin, operations_manager, front_desk, finance, revenue_manager, restaurant_staff). Since restaurant staff only see Food Orders, also add a small "Change Password" link/item in the sidebar for them.

2. **Form fields**: Current Password, New Password, Confirm New Password — with show/hide toggles, matching the premium dashboard styling.

3. **How it works**:
   - Verifies the current password first by re-authenticating with Supabase.
   - Calls `supabase.auth.updateUser({ password: newPassword })` to set the new one.
   - Validates: minimum 8 characters, new passwords must match, current password must be correct.
   - Shows a success message ("Password updated — use it next time you sign in") or a clear error.

4. The staff member stays signed in after the change; the new password applies from the next login.

## Technical notes

- `src/pages/admin/Settings.tsx`: add a "Security" card with the form.
- `src/components/admin/AdminSidebar.tsx`: add a Settings (or "Change Password") nav item for `restaurant_staff` so F&B staff can reach it, landing directly on the password section.
- No database or migration changes needed — Supabase Auth handles the password update.
