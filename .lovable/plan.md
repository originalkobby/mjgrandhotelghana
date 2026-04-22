
## Goal
Replace the current `/gallery` masonry-style mixed-span grid with a Pixieset-inspired clean photo gallery grid: four columns on desktop, image-forward, minimal spacing, uniform presentation, and no existing “wide/tall” layout logic.

## Design direction
The new gallery will use the visual behavior Pixieset commonly uses for client gallery/photo grids:
- Four-column desktop photo grid.
- Clean white/neutral gallery canvas.
- Tight, consistent gutters between images.
- No mixed “wide” or “tall” card spans.
- Photos displayed as a polished gallery wall, not a card layout.
- Subtle image hover interaction only.
- Responsive fallback:
  - 1 column on mobile.
  - 2 columns on small/tablet.
  - 4 columns on large desktop.

## Implementation plan

### 1. Update `src/pages/GalleryPage.tsx`
Remove the existing layout system:
- Remove `sizeClasses`.
- Stop using `img.size` for public grid layout.
- Replace the current `grid-cols-1 md:grid-cols-3 auto-rows-[280px]` layout with a Pixieset-style four-column grid.

New structure:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[6px] md:gap-2">
  {images.map(...)}
</div>
```

Each image item will become:
```tsx
<motion.figure className="group relative overflow-hidden bg-muted">
  <img
    src={img.image_url}
    alt={img.alt_text}
    className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] group-hover:scale-[1.025]"
    loading="lazy"
  />
</motion.figure>
```

This discards the current wide/tall/row-span behavior completely.

### 2. Preserve existing image source logic
Keep the existing data flow:
- Fallback images load first.
- Supabase `gallery_images` records append after fallback images.
- Images remain ordered by `sort_order`.
- Loading skeletons remain while Supabase is fetching.

Only the visual layout changes.

### 3. Update loading skeletons
Change skeletons to match the new four-column Pixieset-style grid:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[6px] md:gap-2">
  {Array.from({ length: 8 }).map(...)}
</div>
```

Skeleton cards will use the same portrait ratio:
```tsx
<Skeleton className="aspect-[3/4] w-full rounded-none" />
```

### 4. Refine the gallery page spacing
Adjust the page container to feel closer to Pixieset’s gallery presentation:
- Keep the existing navbar/footer.
- Keep the “Visual Story / Our Gallery” heading.
- Reduce excessive grid framing