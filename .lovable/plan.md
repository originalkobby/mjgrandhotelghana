

## Suggested Prompt

You can copy and send this directly:

> **"Apply the Dining page's animation system to all homepage sections (except the Hero). Specifically: use `slideFromLeft` and `slideFromRight` for alternating headings and text blocks, `fadeUp` with staggered `containerVariants` for grid/card groups (rooms, gallery, experiences), and `fadeIn` for decorative dividers. Keep the same easing curve and 0.7s duration used on the Dining page. Don't change any content or layout — only upgrade the motion."**

## What This Prompt Achieves

The Dining page uses four distinct animation variants that create visual depth:

| Variant | Effect | Currently on Homepage? |
|---------|--------|----------------------|
| `fadeUp` (y: 30 → 0) | Cards/items staggered in grids | No — homepage uses simpler y: 20 |
| `slideFromLeft` (x: -60 → 0) | Section headings, alternating text | No |
| `slideFromRight` (x: 60 → 0) | Alternating text blocks | No |
| `containerVariants` (stagger 0.08s) | Parent wrapper for card grids | No — homepage has no stagger |

The homepage currently uses a uniform `opacity: 0, y: 20` on everything, which feels flat. The prompt above tells the AI to apply the richer directional and staggered patterns without touching Hero or layout.

## Files That Would Change

| File | What Changes |
|------|-------------|
| `src/components/RoomsPreview.tsx` | Section heading gets `slideFromLeft`/`slideFromRight`; room cards get `containerVariants` + `fadeUp` with stagger |
| `src/components/Experiences.tsx` | Section heading gets directional slides; card wrapper already scrolls so minimal change |
| `src/components/Gallery.tsx` | Heading gets directional animation; grid gets staggered `fadeUp` |
| `src/components/ContactForm.tsx` | Heading and form fields get directional slide animations |
| `src/components/Footer.tsx` | Optionally apply `fadeIn` to footer columns |

No structural, content, or layout changes — purely motion upgrades.

