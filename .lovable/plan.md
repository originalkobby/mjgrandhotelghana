

## Goal
On `/admin/bookings`, make the table's horizontal scrollbar always visible and docked at the **bottom of the screen** (viewport), mirroring how the browser's vertical scrollbar always sits at the right edge of the screen. Use a neutral color — no brand gold.

## Why the current approach isn't enough
The existing `.scrollbar-x-always` utility forces a scrollbar to render on the table wrapper, but that bar lives at the bottom of the table card. When the table is taller than the viewport, the bar scrolls off-screen with the page and the user can't reach it without scrolling all the way down. The user wants it pinned to the viewport bottom like the page's vertical scrollbar is pinned to the viewport right.

## Approach
Add a small sticky "proxy" horizontal scrollbar that sits at the bottom of the bookings table section and stays visible while any part of the table is on screen. It mirrors the table's `scrollLeft` in both directions, so dragging it scrolls the table and scrolling the table moves it.

```text
┌─────────────────── viewport ───────────────────┐
│  Bookings table (scrolls horizontally) │ │ ← native vertical
│  ...rows...                            │ │
│  ...rows...                            │ │
├────────────────────────────────────────┤ │
│  ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │ ← sticky horizontal
└────────────────────────────────────────────────┘
```

Sticky (not fixed) so it naturally disappears when the user scrolls past the table — same feel as a real scrollbar that only exists while its content is in view.

## Edits

### 1. `src/components/ui/StickyHorizontalScrollbar.tsx` — new component
A small headless component that:
- Takes a `targetRef` (the scrollable table wrapper).
- Renders a `position: sticky; bottom: 0` track containing a thumb whose width = `clientWidth / scrollWidth × 100%` and whose left offset = `scrollLeft / scrollWidth × 100%`.
- Listens to the target's `scroll` event to update the thumb.
- On pointer-drag of the thumb (or click on the track), updates `target.scrollLeft`.
- Uses `ResizeObserver` on the target to recompute thumb size when columns/rows change.
- Hides itself (`display: none`) when `scrollWidth <= clientWidth` (nothing to scroll).
- Styled with neutral tokens only: track `bg-muted`, thumb `bg-muted-foreground/40` hover `bg-muted-foreground/60`, height `10px`, rounded full, small inset padding — matching the look of native vertical scrollbars on this site without using gold.

### 2. `src/index.css` — replace the gold styling on `.scrollbar-x-always`
Keep the utility (still useful as the actual scroll container) but:
- Drop the gold thumb colors. Use neutral: thumb `hsl(var(--muted-foreground) / 0.4)`, hover `hsl(var(--muted-foreground) / 0.6)`, track `hsl(var(--muted))`.
- Hide the **native** WebKit scrollbar on this container (`height: 0`) and set `scrollbar-width: none` for Firefox, because the sticky proxy is now the only visible bar. This avoids two stacked scrollbars.

### 3. `src/pages/admin/Bookings.tsx` — wire it up
- Add a `tableScrollRef = useRef<HTMLDivElement>(null)` and attach it to the existing `<div className="scrollbar-x-always">` wrapper (line 558).
- Immediately after that wrapper's closing `</div>` (still inside `<CardContent>`), render `<StickyHorizontalScrollbar targetRef={tableScrollRef} />`.
- No other table changes.

## Behavior summary
- When the bookings table is wider than the screen, a neutral grey horizontal bar appears stuck to the bottom of the table card and remains visible while any part of the table is on screen — just like the browser's native vertical scrollbar stays at the right.
- Dragging the bar scrolls the table; scrolling the table (touch/wheel/keyboard) moves the bar.
- When the table fits, the bar hides itself.
- No gold accent anywhere.

## Out of scope
- No changes to columns, data, sorting, filtering, bulk-delete, manage dialog, or any other admin table.
- The page's vertical scrollbar is unchanged.

