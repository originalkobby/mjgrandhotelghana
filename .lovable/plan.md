

## Plan: Auto-Slideshow on 3rd Gallery Card

### What It Does
The 3rd card in the homepage Gallery section becomes an automatic picture slideshow. It cycles through all gallery images from the database (excluding the 3 other images already visible in this section), never repeating until all have been shown, then loops. New images added to the gallery are picked up automatically via React Query.

### How It Works

1. **Gallery.tsx** — Change the 3rd card (index 2) from a static image to a `SlideshowCard` component:
   - Fetch all gallery images from the `gallery_images` table (same query as `GalleryPage`)
   - Filter out the 3 images currently displayed in the other cards
   - Cycle through the remaining images with a crossfade transition every ~4 seconds
   - Track shown images in local state; reset the "seen" list only after all have been displayed
   - React Query's background refetch ensures newly added images appear in the next cycle

2. **Crossfade animation** — Two stacked `<img>` tags with opacity transitions (Framer Motion or CSS). The outgoing image fades out while the incoming fades in over ~700ms.

3. **No repeat logic** — Maintain a `Set` of shown image IDs. Pick randomly from unseen images. When the set equals the pool size, clear it and restart.

### Files Modified

| File | Change |
|------|--------|
| `src/components/Gallery.tsx` | Replace the 3rd card with a `SlideshowCard` component; add slideshow logic with crossfade and no-repeat cycling |

### Technical Details
- Reuses the existing `public-gallery` React Query key for data
- `useEffect` with `setInterval` drives the timer; cleanup on unmount
- Fallback: if no DB images exist beyond the static ones, the card shows the original static image
- No database or schema changes required

