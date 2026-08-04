-- Restore public read access to rooms (excluding sensitive room_numbers) and availability view
GRANT SELECT (id, name, slug, description, size_sqm, bed_type, max_adults, max_children, base_price_ghs, amenities, images, sort_order, is_active, created_at, total_units) ON public.rooms TO anon, authenticated;

-- Switch room_availability view to security_definer so it bypasses RLS on room_inventory
-- (the view already excludes any sensitive columns; it only exposes aggregate availability)
ALTER VIEW public.room_availability SET (security_invoker = false);
GRANT SELECT ON public.room_availability TO anon, authenticated;