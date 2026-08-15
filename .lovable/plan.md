# Widen Search Input on Bookings Page

## Goal
Increase the width of the search input box in the `/admin/bookings` header filter area so the placeholder text is more visible and the field is easier to use.

## Current state
- File: `src/pages/admin/Bookings.tsx`
- The search input is rendered at lines ~571–578.
- Its parent container currently uses `max-w-sm`, which limits the input width.

## Proposed change
- Change the parent container from `max-w-sm` to `max-w-md`.
- Keep the existing `Input` styling and layout intact.

## Verification
- Preview the `/admin/bookings` route and confirm the search input is noticeably wider.
- Ensure the rest of the filter row remains responsive and aligned.
