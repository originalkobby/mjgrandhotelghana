CREATE POLICY "Front desk can view promos"
ON public.promotions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'front_desk'::app_role));