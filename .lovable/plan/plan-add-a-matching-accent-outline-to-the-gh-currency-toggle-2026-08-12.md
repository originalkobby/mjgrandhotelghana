Plan: Add a matching accent outline to the GH₵ currency toggle

Goal
Update the admin currency toggle so the GH₵ button has an outline that visually extends from the USD button and uses the same accent color as the active USD button.

Scope
- Only touches the admin header currency toggle in `src/pages/admin/AdminLayout.tsx`.
- No other UI, functionality, or data changes.

Approach
1. Add an `outline` style to the GH₵ button's non-active state.
2. Use the existing accent token (gold, `#D4AF37` / `hsl(var(--accent))`) so the outline matches the active USD button color.
3. Keep the segmented-group spacing tight and remove any outline offset/ring that would make it look like a separate control.

Verification
- Check the admin header in the preview to confirm the GH₵ button now has an outline in the same color as the USD button.
- Ensure the active-state GH₵ button remains filled and does not show a double outline.
