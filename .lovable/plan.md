Plan: Add a matching accent outline to the USD currency toggle

Goal
Update the admin currency toggle so the USD button has an outline that visually extends from the GH₵ button and uses the same accent color as the GH₵ button.

Scope
- Only touches the admin header currency toggle in `src/pages/admin/AdminLayout.tsx`.
- No other UI, functionality, or data changes.

Approach
1. Add an accent-color outline to the USD button's non-active state.
2. Use the existing accent token (gold) so the outline matches the GH₵ button's active/filled color.
3. Keep the segmented-group spacing tight and avoid any outline offset/ring.

Verification
- Check the admin header in the preview to confirm the USD button now has an outline matching the GH₵ button.
- Ensure the active-state USD button remains filled and does not show a double outline.
