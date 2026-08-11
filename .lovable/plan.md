# Assign Operations Manager access to op.mj@mjgrandhotelghana.com

The new account exists (no role yet). The old `op@mjgrandhotelghana.com` account still holds the operations_manager role.

## Steps

1. Assign the `operations_manager` role to the new user `op.mj@mjgrandhotelghana.com` (data change on the roles table).
2. Remove Rooms from the Operations Manager's navigation and access:
   - Drop `operations_manager` from the Rooms item in the admin sidebar so the link is hidden.
   - Guard the Rooms page itself so a direct URL visit by an Operations Manager redirects back to the dashboard.
3. Leave every other Operations Manager area unchanged: Bookings, Guests, Inventory, Support, Messages.

## Open question

Should the old `op@mjgrandhotelghana.com` account keep its access, or should its role be removed so only the new email works? Default if you don't say: keep both active.

## Technical notes

- Role row inserted into `public.user_roles` for user `704f0675-fe6b-4ce9-a974-7ef49304c9cd`.
- Sidebar filter lives in `src/components/admin/AdminSidebar.tsx` (`NAV_ITEMS` roles array).
- Page-level guard added in `src/pages/admin/Rooms.tsx` using the role from `useAdminAuth`.
