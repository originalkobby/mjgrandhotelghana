# Center Hero Text Elements

## Goal
Center the hero headline, subtitle, description, and CTA buttons on all screen sizes.

## Current State
In `src/components/Hero.tsx`, the text container is centered on mobile but switches to left alignment at the `lg` breakpoint:

```text
Line 75: className="flex flex-col items-center text-center lg:items-start lg:text-left"
```

## Change
Update the container's Tailwind classes so alignment remains centered at every breakpoint.

```text
Before: flex flex-col items-center text-center lg:items-start lg:text-left
After:  flex flex-col items-center text-center
```

## Verification
- Open the homepage preview.
- Confirm the subtitle, "MJ Grand Hotel" heading, description paragraph, and both buttons are horizontally centered on desktop and mobile.

## Files to edit
- `src/components/Hero.tsx` (line 75)
