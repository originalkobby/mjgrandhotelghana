-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.delivery_status AS ENUM (
    'pending_review','review_rejected','confirmed','preparing','ready_for_pickup',
    'rider_assigned','rider_accepted','rider_picked_up','on_the_way','delivered',
    'cancelled','failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.rider_status AS ENUM ('available','busy','offline','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.delivery_payment_method AS ENUM ('paystack','cash_on_delivery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.food_payment_status AS ENUM ('pending','paid','failed','cancelled','cash_on_delivery','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ SHARED HELPERS ============
CREATE OR REPLACE FUNCTION public.set_delivery_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.is_delivery_ops(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') OR public.has_role(_user_id,'operations_manager');
$$;

CREATE OR REPLACE FUNCTION public.is_delivery_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin')
      OR public.has_role(_user_id,'operations_manager')
      OR public.has_role(_user_id,'restaurant_staff');
$$;

-- ============ DELIVERY SETTINGS (singleton) ============
CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton),
  delivery_enabled boolean NOT NULL DEFAULT true,
  origin_name text NOT NULL DEFAULT 'MJ Grand Hotel',
  origin_address text NOT NULL DEFAULT 'No. 460 Abotsi Street, East Legon, Accra, Ghana',
  origin_lat double precision NOT NULL DEFAULT 5.6358,
  origin_lng double precision NOT NULL DEFAULT -0.1577,
  service_area_label text NOT NULL DEFAULT 'Accra',
  reference_rate_ghs numeric(10,2) NOT NULL DEFAULT 30.00 CHECK (reference_rate_ghs >= 0),
  discount_percent numeric(5,2) NOT NULL DEFAULT 10.00 CHECK (discount_percent >= 0 AND discount_percent <= 90),
  base_fee_ghs numeric(10,2) NOT NULL DEFAULT 8.00 CHECK (base_fee_ghs >= 0),
  price_per_km_ghs numeric(10,2) NOT NULL DEFAULT 3.50 CHECK (price_per_km_ghs >= 0),
  min_fee_ghs numeric(10,2) NOT NULL DEFAULT 10.00 CHECK (min_fee_ghs >= 0),
  max_fee_ghs numeric(10,2) NOT NULL DEFAULT 100.00 CHECK (max_fee_ghs >= 0),
  manual_review_km numeric(6,2) NOT NULL DEFAULT 20.00 CHECK (manual_review_km >= 0),
  max_delivery_km numeric(6,2) NOT NULL DEFAULT 60.00 CHECK (max_delivery_km >= 0),
  peak_start_hour smallint NOT NULL DEFAULT 18 CHECK (peak_start_hour BETWEEN 0 AND 23),
  peak_end_hour smallint NOT NULL DEFAULT 21 CHECK (peak_end_hour BETWEEN 0 AND 23),
  peak_uplift_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (peak_uplift_percent >= 0 AND peak_uplift_percent <= 100),
  default_prep_minutes smallint NOT NULL DEFAULT 25 CHECK (default_prep_minutes >= 0),
  eta_buffer_minutes smallint NOT NULL DEFAULT 10 CHECK (eta_buffer_minutes >= 0),
  auto_assign_riders boolean NOT NULL DEFAULT false,
  customer_tracking_enabled boolean NOT NULL DEFAULT true,
  delivery_emails_enabled boolean NOT NULL DEFAULT true,
  rider_ping_seconds smallint NOT NULL DEFAULT 20 CHECK (rider_ping_seconds >= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.delivery_settings TO authenticated;
GRANT ALL ON public.delivery_settings TO service_role;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read delivery settings" ON public.delivery_settings
  FOR SELECT TO authenticated USING (public.is_delivery_staff(auth.uid()));
CREATE POLICY "Ops can update delivery settings" ON public.delivery_settings
  FOR UPDATE TO authenticated USING (public.is_delivery_ops(auth.uid())) WITH CHECK (public.is_delivery_ops(auth.uid()));

CREATE TRIGGER trg_delivery_settings_updated BEFORE UPDATE ON public.delivery_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_delivery_updated_at();

INSERT INTO public.delivery_settings (singleton) VALUES (true) ON CONFLICT DO NOTHING;

-- ============ RIDERS ============
CREATE TABLE IF NOT EXISTS public.delivery_riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  rider_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  vehicle_type text NOT NULL DEFAULT 'motorbike',
  vehicle_reference text,
  status public.rider_status NOT NULL DEFAULT 'offline',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  last_active_at timestamptz,
  last_lat double precision,
  last_lng double precision,
  last_location_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_riders TO authenticated;
GRANT ALL ON public.delivery_riders TO service_role;
ALTER TABLE public.delivery_riders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view riders" ON public.delivery_riders
  FOR SELECT TO authenticated USING (public.is_delivery_staff(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Ops can create riders" ON public.delivery_riders
  FOR INSERT TO authenticated WITH CHECK (public.is_delivery_ops(auth.uid()));
CREATE POLICY "Ops or self can update riders" ON public.delivery_riders
  FOR UPDATE TO authenticated
  USING (public.is_delivery_ops(auth.uid()) OR user_id = auth.uid())
  WITH CHECK (public.is_delivery_ops(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Admins can delete riders" ON public.delivery_riders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_delivery_riders_updated BEFORE UPDATE ON public.delivery_riders
  FOR EACH ROW EXECUTE FUNCTION public.set_delivery_updated_at();

CREATE OR REPLACE FUNCTION public.current_rider_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.delivery_riders WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============ DELIVERIES ============
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_order_id uuid NOT NULL UNIQUE REFERENCES public.food_orders(id) ON DELETE CASCADE,
  status public.delivery_status NOT NULL DEFAULT 'confirmed',
  tracking_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  dest_address text NOT NULL,
  dest_landmark text,
  dest_lat double precision NOT NULL,
  dest_lng double precision NOT NULL,
  origin_lat double precision NOT NULL,
  origin_lng double precision NOT NULL,
  distance_km numeric(8,2) NOT NULL DEFAULT 0,
  travel_minutes integer NOT NULL DEFAULT 0,
  eta_min_minutes integer NOT NULL DEFAULT 30,
  eta_max_minutes integer NOT NULL DEFAULT 45,
  fee_ghs numeric(10,2) NOT NULL DEFAULT 0,
  fee_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  fee_overridden_by uuid,
  requires_review boolean NOT NULL DEFAULT false,
  review_decision text CHECK (review_decision IN ('approved','rejected')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rider_id uuid REFERENCES public.delivery_riders(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  on_the_way_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid,
  cancel_reason text,
  last_customer_email_status public.delivery_status,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider ON public.deliveries(rider_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created ON public.deliveries(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff or assigned rider can view deliveries" ON public.deliveries
  FOR SELECT TO authenticated
  USING (public.is_delivery_staff(auth.uid()) OR rider_id = public.current_rider_id());
CREATE POLICY "Staff can create deliveries" ON public.deliveries
  FOR INSERT TO authenticated WITH CHECK (public.is_delivery_staff(auth.uid()));
CREATE POLICY "Staff or assigned rider can update deliveries" ON public.deliveries
  FOR UPDATE TO authenticated
  USING (public.is_delivery_staff(auth.uid()) OR rider_id = public.current_rider_id())
  WITH CHECK (public.is_delivery_staff(auth.uid()) OR rider_id = public.current_rider_id());
CREATE POLICY "Admins can delete deliveries" ON public.deliveries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_deliveries_updated BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_delivery_updated_at();

-- ============ STATUS HISTORY ============
CREATE TABLE IF NOT EXISTS public.delivery_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  previous_status public.delivery_status,
  new_status public.delivery_status NOT NULL,
  changed_by uuid,
  actor_role text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_delivery_history_delivery ON public.delivery_status_history(delivery_id, created_at);

GRANT SELECT, INSERT ON public.delivery_status_history TO authenticated;
GRANT ALL ON public.delivery_status_history TO service_role;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff or assigned rider can read history" ON public.delivery_status_history
  FOR SELECT TO authenticated
  USING (public.is_delivery_staff(auth.uid())
     OR EXISTS (SELECT 1 FROM public.deliveries d WHERE d.id = delivery_id AND d.rider_id = public.current_rider_id()));
CREATE POLICY "Staff or assigned rider can add history" ON public.delivery_status_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_delivery_staff(auth.uid())
     OR EXISTS (SELECT 1 FROM public.deliveries d WHERE d.id = delivery_id AND d.rider_id = public.current_rider_id()));

-- ============ RIDER LOCATIONS ============
CREATE TABLE IF NOT EXISTS public.rider_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.delivery_riders(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy_m double precision,
  heading double precision,
  speed_mps double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rider_locations_delivery ON public.rider_locations(delivery_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_rider_locations_rider ON public.rider_locations(rider_id, recorded_at DESC);

GRANT SELECT, INSERT ON public.rider_locations TO authenticated;
GRANT ALL ON public.rider_locations TO service_role;
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ops or owning rider can read locations" ON public.rider_locations
  FOR SELECT TO authenticated
  USING (public.is_delivery_ops(auth.uid()) OR rider_id = public.current_rider_id());
CREATE POLICY "Rider can insert own location" ON public.rider_locations
  FOR INSERT TO authenticated WITH CHECK (rider_id = public.current_rider_id());

-- ============ AUDIT LOG ============
CREATE TABLE IF NOT EXISTS public.delivery_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_delivery_audit_created ON public.delivery_audit_log(created_at DESC);

GRANT SELECT, INSERT ON public.delivery_audit_log TO authenticated;
GRANT ALL ON public.delivery_audit_log TO service_role;
ALTER TABLE public.delivery_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ops can read audit log" ON public.delivery_audit_log
  FOR SELECT TO authenticated USING (public.is_delivery_ops(auth.uid()));
CREATE POLICY "Staff can write audit log" ON public.delivery_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_delivery_staff(auth.uid()));

-- ============ FOOD ORDERS EXTENSIONS ============
ALTER TABLE public.food_orders
  ADD COLUMN IF NOT EXISTS payment_method public.delivery_payment_method,
  ADD COLUMN IF NOT EXISTS payment_status public.food_payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paystack_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS subtotal_ghs numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ready_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_email_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_food_orders_paystack_ref ON public.food_orders(paystack_reference);