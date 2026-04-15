

## Plan: Admin Gallery Management

### Summary
Add a Gallery Management page to the admin dashboard where you can upload images, choose display sizes (normal, wide, tall), reorder them, and have the public gallery page pull images dynamically from Supabase.

### What You'll Get
- A new "Gallery" section in the admin sidebar
- Upload images to your existing `hotel-uploads` bucket
- Choose a size (normal, wide, tall) for each image
- Set alt text and reorder images via drag or sort controls
- The public `/gallery` page will load images from the database instead of hardcoded assets

### Technical Steps

**1. Create `gallery_images` table (migration)**
```sql
CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  size text NOT NULL DEFAULT 'normal' CHECK (size IN ('normal', 'wide', 'tall')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view gallery" ON public.gallery_images
  FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admins can manage gallery" ON public.gallery_images
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

**2. Create admin page `src/pages/admin/GalleryManagement.tsx`**
- Grid of uploaded images with size badge and sort order
- "Add Image" dialog using the existing `ImageUpload` component
- Fields: image upload, alt text, size dropdown (normal/wide/tall), sort order
- Edit and delete actions per image
- Reuses existing patterns from Rooms/Menu management pages

**3. Add "Gallery" to admin sidebar and routes**
- New nav item in `AdminSidebar.tsx` (admin-only, using `ImageIcon`)
- New route `/admin/gallery` in `App.tsx`

**4. Update `GalleryPage.tsx` to fetch from Supabase**
- Replace hardcoded `galleryImages` array with a query to `gallery_images` table ordered by `sort_order`
- Keep existing masonry grid layout and animations
- Show skeleton loaders while fetching

**5. Update `Gallery.tsx` (homepage preview) to also pull from DB**
- Fetch first 4-5 images from `gallery_images` for the homepage preview
- Fall back to existing static images if table is empty

### Files Changed
- **New**: `src/pages/admin/GalleryManagement.tsx`
- **Edit**: `src/components/admin/AdminSidebar.tsx` — add Gallery nav item
- **Edit**: `src/App.tsx` — add admin gallery route
- **Edit**: `src/pages/GalleryPage.tsx` — fetch from Supabase
- **Edit**: `src/components/Gallery.tsx` — fetch from Supabase
- **Migration**: create `gallery_images` table

