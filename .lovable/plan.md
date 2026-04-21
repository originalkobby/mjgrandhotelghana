

## Goal
On `/admin/bookings`, make the horizontal scrollbar of the bookings table permanently visible (not just on hover/scroll), so admins always see it as an affordance.

## Approach
The table is wrapped in `<div className="overflow-x-auto">` (line 558 of `src/pages/admin/Bookings.tsx`). By default, browsers (especially WebKit on macOS/iOS) auto-hide scrollbars. We'll force the horizontal scrollbar to render at all times using a small scoped CSS utility, without affecting other tables in the app.

## Edits

### 1. `src/index.css` — add a utility class
Append a new utility under `@layer utilities`:

```css
.scrollbar-x-always {
  overflow-x: scroll;
  scrollbar-gutter: stable;
}
.scrollbar-x-always::-webkit-scrollbar {
  height: 10px;
  -webkit-appearance: none;
}
.scrollbar-x-always::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 9999px;
}
.scrollbar-x-always::-webkit-scrollbar-thumb {
  background: hsl(var(--gold) / 0.5);
  border-radius: 9999px;
}
.scrollbar-x-always::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--gold));
}
/* Firefox */
.scrollbar-x-always {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--gold) / 0.5) hsl(var(--muted));
}
```

Notes:
- `overflow-x: scroll` (instead of `auto`) forces the bar to render even when content fits.
- Styled in brand gold-on-muted to match the luxury palette already in the project.

### 2. `src/pages/admin/Bookings.tsx` — apply the utility
Replace the wrapper class on line 558:

```tsx
<div className="overflow-x-auto">
```
with:
```tsx
<div className="scrollbar-x-always">
```

## Out of scope
- No changes to table columns, data, sorting, filtering, bulk-delete, or the manage dialog.
- Other admin tables (Guests, Rooms, etc.) keep their existing scroll behavior.

