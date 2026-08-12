# Display Overview NavLink on all staff logins

## Goal
Show the "Overview" dashboard link in the admin sidebar for Front Desk and Operations Manager users, not just Admin, Revenue Manager, and Finance.

## Current state
`src/components/admin/AdminSidebar.tsx` defines the Overview NavLink with `roles: ["admin", "revenue_manager", "finance"]`. Front Desk and Operations Manager users therefore do not see the link, even though the `/admin` (Overview) page itself has no role-specific guard beyond being signed in with any staff role.

## Change
Update the `roles` array for the Overview item in `NAV_ITEMS` to include all staff roles:

```text
admin, revenue_manager, finance, front_desk, operations_manager
```

Equivalently, set `roles: null` (like Bookings/Messages) so the link is visible to every authenticated staff member.

## Files to edit
- `src/components/admin/AdminSidebar.tsx` — one-line change in `NAV_ITEMS`.

## Verification
- Sign in as a user with `front_desk` or `operations_manager` role and confirm the "Overview" link appears in the sidebar.
- Click the link and confirm it navigates to `/admin` and renders the dashboard.
