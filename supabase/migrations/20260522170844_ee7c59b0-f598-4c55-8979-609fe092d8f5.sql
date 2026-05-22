-- Restore public read access for booking page

-- rooms: grant SELECT on all columns except room_numbers (kept staff-only)
GRANT SELECT (id, name, slug, description, size_sqm, bed_type, max_adults, max_children, base_price_ghs, amenities, images, sort_order, is_active, created_at, total_units) ON public.rooms TO anon, authenticated;

-- room_availability view: public-safe view of inventory
GRANT SELECT ON public.room_availability TO anon, authenticated;

-- add_ons, cancellation_policies, seasonal_pricing, gallery_images, menu_items already have public SELECT policies; ensure grants too
GRANT SELECT ON public.add_ons TO anon, authenticated;
GRANT SELECT ON public.cancellation_policies TO anon, authenticated;
GRANT SELECT ON public.seasonal_pricing TO anon, authenticated;
GRANT SELECT ON public.gallery_images TO anon, authenticated;
GRANT SELECT ON public.menu_items TO anon, authenticated;