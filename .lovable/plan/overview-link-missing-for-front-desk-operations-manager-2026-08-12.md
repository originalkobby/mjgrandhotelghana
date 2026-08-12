# Overview link missing for Front Desk / Operations Manager

## What the code currently says

The sidebar entry in `src/components/admin/AdminSidebar.tsx` already lists all five staff roles for Overview:

```text
admin, revenue_manager, finance, front_desk, operations_manager
```

The role values stored for the staff accounts match exactly (`front_desk`, `operations_manager`), and the `/admin` Overview route has no extra role guard. So the source in this project is already correct — the most likely reason staff still don't see the link is that they are signing in on the published site, which was last built before this change.

## Steps

1. Publish the project so the live site (mjgrandhotelghana.com) picks up the current sidebar.
2. Verify in the preview by signing in as a Front Desk and an Operations Manager account and confirming "Overview" appears and loads `/admin`.
3. If the link is still missing in the *preview* after a hard refresh, then the cause is the role value the app resolves at runtime rather than the nav config — in that case add a temporary log of the resolved role from `useAdminAuth` and fix the mismatch (for example, a role read returning null and falling back), rather than editing the nav list again.

## Technical notes

- Nav config: `src/components/admin/AdminSidebar.tsx` (`NAV_ITEMS`, filter on `item.roles.includes(role)`).
- Role resolution: `src/hooks/useAdminAuth.ts` — direct `user_roles` read with `get_my_admin_role()` RPC fallback.
