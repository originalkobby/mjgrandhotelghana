-- Allow public (anonymous) users to insert/upsert guests during booking
CREATE POLICY "Public can insert guests"
ON public.guests
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to select guests (needed for upsert returning data)
CREATE POLICY "Public can select guests by email"
ON public.guests
FOR SELECT
TO public
USING (true);