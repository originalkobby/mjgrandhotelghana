
CREATE POLICY "Admins can update uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'hotel-uploads' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'hotel-uploads' AND public.has_role(auth.uid(), 'admin'::public.app_role));
