-- Create storage bucket for hotel uploads (rooms, menu images)
INSERT INTO storage.buckets (id, name, public) VALUES ('hotel-uploads', 'hotel-uploads', true);

-- Allow public read access
CREATE POLICY "Public can view hotel uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'hotel-uploads');

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload hotel images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hotel-uploads' AND (SELECT public.has_role(auth.uid(), 'admin'::public.app_role)));

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete hotel images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hotel-uploads' AND (SELECT public.has_role(auth.uid(), 'admin'::public.app_role)));
