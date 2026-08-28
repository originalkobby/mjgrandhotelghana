CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  fee_ghs numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.delivery_zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_zones TO authenticated;
GRANT ALL ON public.delivery_zones TO service_role;

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active delivery zones"
  ON public.delivery_zones FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operations_manager'));

CREATE POLICY "Staff can insert delivery zones"
  ON public.delivery_zones FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operations_manager'));

CREATE POLICY "Staff can update delivery zones"
  ON public.delivery_zones FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operations_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operations_manager'));

CREATE POLICY "Staff can delete delivery zones"
  ON public.delivery_zones FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operations_manager'));

CREATE TRIGGER delivery_zones_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_food_orders_updated_at();

ALTER TABLE public.food_orders
  ADD COLUMN delivery_zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  ADD COLUMN delivery_address text,
  ADD COLUMN delivery_landmark text,
  ADD COLUMN delivery_fee_ghs numeric NOT NULL DEFAULT 0;

ALTER TYPE public.order_type ADD VALUE IF NOT EXISTS 'delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery' AFTER 'ready';