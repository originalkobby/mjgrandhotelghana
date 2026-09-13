CREATE TABLE public.food_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  visit_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT, UPDATE ON public.food_customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_customers TO authenticated;
GRANT ALL ON public.food_customers TO service_role;

ALTER TABLE public.food_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register a device"
ON public.food_customers FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(full_name)) BETWEEN 1 AND 100
  AND length(trim(email)) BETWEEN 3 AND 255
  AND length(trim(phone)) BETWEEN 7 AND 20
  AND length(device_id) BETWEEN 8 AND 64
);

CREATE POLICY "Anyone can refresh their device record"
ON public.food_customers FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  length(trim(full_name)) BETWEEN 1 AND 100
  AND length(trim(email)) BETWEEN 3 AND 255
  AND length(trim(phone)) BETWEEN 7 AND 20
);

CREATE POLICY "Staff can view food customers"
ON public.food_customers FOR SELECT
TO authenticated
USING (public.is_delivery_staff(auth.uid()));

CREATE POLICY "Admins can delete food customers"
ON public.food_customers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER food_customers_updated_at
BEFORE UPDATE ON public.food_customers
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_food_customers_last_seen ON public.food_customers (last_seen_at DESC);