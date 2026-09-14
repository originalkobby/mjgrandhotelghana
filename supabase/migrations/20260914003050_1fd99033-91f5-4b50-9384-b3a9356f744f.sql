ALTER TABLE public.food_customers ALTER COLUMN device_id DROP NOT NULL;
ALTER TABLE public.food_customers ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'device';

-- collapse any duplicate emails before adding the unique index (table currently empty, but be safe)
DELETE FROM public.food_customers a
USING public.food_customers b
WHERE a.id <> b.id
  AND lower(btrim(a.email)) = lower(btrim(b.email))
  AND a.last_seen_at < b.last_seen_at;

CREATE UNIQUE INDEX IF NOT EXISTS food_customers_email_key ON public.food_customers (lower(btrim(email)));

CREATE OR REPLACE FUNCTION public.capture_food_customer(
  _full_name text,
  _email text,
  _phone text,
  _device_id text DEFAULT NULL,
  _source text DEFAULT 'order',
  _seen_at timestamptz DEFAULT now()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(_email, '')));
  v_name  text := btrim(coalesce(_full_name, ''));
  v_phone text := btrim(coalesce(_phone, ''));
  v_id uuid;
BEGIN
  IF v_email = '' OR v_name = '' THEN RETURN; END IF;

  SELECT id INTO v_id FROM public.food_customers WHERE lower(btrim(email)) = v_email LIMIT 1;

  IF v_id IS NULL AND _device_id IS NOT NULL THEN
    SELECT id INTO v_id FROM public.food_customers WHERE device_id = _device_id LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.food_customers (full_name, email, phone, device_id, source, visit_count, first_seen_at, last_seen_at)
    VALUES (v_name, v_email, nullif(v_phone, ''), _device_id, _source, 1, _seen_at, _seen_at)
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE public.food_customers
    SET full_name = v_name,
        email = v_email,
        phone = COALESCE(nullif(v_phone, ''), phone),
        device_id = COALESCE(device_id, _device_id),
        visit_count = visit_count + 1,
        first_seen_at = LEAST(first_seen_at, _seen_at),
        last_seen_at = GREATEST(last_seen_at, _seen_at)
    WHERE id = v_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_food_customer(text, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_food_customer(text, text, text, text, text, timestamptz) TO service_role;