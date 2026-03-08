CREATE POLICY "Admins can delete promos"
ON public.promotions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));