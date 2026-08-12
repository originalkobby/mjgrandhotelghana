Plan: Remove divider and make Sign Out text white

Goal
1. Remove the pipe/divider between the currency toggle and the "Exchange Rate" readout in the admin header.
2. Change the "Sign Out" text in the admin sidebar to white.

Scope
- `src/pages/admin/AdminLayout.tsx` (remove the divider span).
- `src/components/admin/AdminSidebar.tsx` (change Sign Out text color).

Approach
1. In `AdminLayout.tsx`, remove the `<span className="admin-rail-divider hidden md:block" />` that sits between the currency toggle and the Exchange Rate label.
2. In `AdminSidebar.tsx`, update the Sign Out `SidebarMenuButton` class to use `text-white` instead of the current destructive/red tint. Keep the hover background subtle so it remains usable.

Verification
- Confirm the admin header rail shows the currency toggle immediately followed by the Exchange Rate block with no vertical divider.
- Confirm the "Sign Out" item in the sidebar appears in white.
