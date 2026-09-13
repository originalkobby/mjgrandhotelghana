# Add show-password toggle to the Rider Portal sign-in form

## What
Add an eye/eye-off toggle button to the password field on the `/rider` sign-in form, matching the pattern already used on the admin login page (`src/pages/admin/Login.tsx`).

## Where
`src/pages/RiderPortal.tsx` — the unauthenticated sign-in card (lines ~230–266).

## Changes
1. Add a `showPw` boolean state next to the existing `password` state.
2. Import `Eye` and `EyeOff` from `lucide-react` (already imports `Bike`, `Loader2`, etc. from the same package).
3. Wrap the password `Input` in a `relative` div.
4. Set the input `type` to `showPw ? "text" : "password"` and add `pr-10` so text doesn't run under the icon.
5. Add a toggle button absolutely positioned on the right (`absolute right-2 top-1/2 -translate-y-1/2`) that flips `showPw`, styled with the cream/gold theme (`text-cream/50 hover:text-cream`), `type="button"`, and an accessible `aria-label`.

## Out of scope
- No changes to the admin login (already has the feature).
- No changes to any other page or the shared `Input` component.
