-- ===== enums =====
CREATE TYPE public.rider_comp_model AS ENUM ('fixed','per_km','percentage','hybrid');
CREATE TYPE public.rider_earning_status AS ENUM ('pending','approved','payable','paid','disputed','adjusted');
CREATE TYPE public.rider_payout_method AS ENUM ('cash','mobile_money','bank_transfer');

-- ===== compensation rules =====
CREATE TABLE public.rider_compensation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model public.rider_comp_model NOT NULL DEFAULT 'fixed',
  base_ghs numeric NOT NULL DEFAULT 15,
  per_km_ghs numeric NOT NULL DEFAULT 0,
  percent_of_fee numeric NOT NULL DEFAULT 0,
  min_earning_ghs numeric NOT NULL DEFAULT 0,
  max_earning_ghs numeric NOT NULL DEFAULT 200,
  peak_bonus_ghs numeric NOT NULL DEFAULT 0,
  peak_start_hour smallint NOT NULL DEFAULT 18,
  peak_end_hour smallint NOT NULL DEFAULT 21,
  is_active boolean NOT NULL DEFAULT false,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rider_compensation_rules TO authenticated;
GRANT ALL ON public.rider_compensation_rules TO service_role;
ALTER TABLE public.rider_compensation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comp rules readable by delivery staff"
  ON public.rider_compensation_rules FOR SELECT TO authenticated
  USING (public.is_delivery_staff(auth.uid()));
CREATE POLICY "comp rules managed by ops"
  ON public.rider_compensation_rules FOR ALL TO authenticated
  USING (public.is_delivery_ops(auth.uid()))
  WITH CHECK (public.is_delivery_ops(auth.uid()));

-- only one active rule at a time
CREATE UNIQUE INDEX rider_comp_rules_one_active
  ON public.rider_compensation_rules ((is_active)) WHERE is_active;

-- ===== earnings ledger =====
CREATE TABLE public.rider_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL UNIQUE REFERENCES public.deliveries(id) ON DELETE CASCADE,
  food_order_id uuid REFERENCES public.food_orders(id) ON DELETE SET NULL,
  rider_id uuid NOT NULL REFERENCES public.delivery_riders(id) ON DELETE RESTRICT,
  distance_km numeric NOT NULL DEFAULT 0,
  customer_fee_ghs numeric NOT NULL DEFAULT 0,
  base_earning_ghs numeric NOT NULL DEFAULT 0,
  adjustment_total_ghs numeric NOT NULL DEFAULT 0,
  earning_ghs numeric NOT NULL DEFAULT 0,
  status public.rider_earning_status NOT NULL DEFAULT 'pending',
  rule_id uuid REFERENCES public.rider_compensation_rules(id) ON DELETE SET NULL,
  rule_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivered_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  payout_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rider_earnings_rider_idx ON public.rider_earnings(rider_id, status);
CREATE INDEX rider_earnings_created_idx ON public.rider_earnings(created_at DESC);
GRANT SELECT ON public.rider_earnings TO authenticated;
GRANT ALL ON public.rider_earnings TO service_role;
ALTER TABLE public.rider_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riders read own earnings"
  ON public.rider_earnings FOR SELECT TO authenticated
  USING (rider_id = public.current_rider_id() OR public.is_delivery_ops(auth.uid()));
CREATE POLICY "ops manage earnings"
  ON public.rider_earnings FOR ALL TO authenticated
  USING (public.is_delivery_ops(auth.uid()))
  WITH CHECK (public.is_delivery_ops(auth.uid()));

-- ===== adjustments =====
CREATE TABLE public.rider_earning_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  earning_id uuid NOT NULL REFERENCES public.rider_earnings(id) ON DELETE CASCADE,
  delta_ghs numeric NOT NULL,
  reason text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rider_adjustments_earning_idx ON public.rider_earning_adjustments(earning_id);
GRANT SELECT ON public.rider_earning_adjustments TO authenticated;
GRANT ALL ON public.rider_earning_adjustments TO service_role;
ALTER TABLE public.rider_earning_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adjustments visible to rider and ops"
  ON public.rider_earning_adjustments FOR SELECT TO authenticated
  USING (
    public.is_delivery_ops(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rider_earnings e
      WHERE e.id = earning_id AND e.rider_id = public.current_rider_id()
    )
  );
CREATE POLICY "ops create adjustments"
  ON public.rider_earning_adjustments FOR INSERT TO authenticated
  WITH CHECK (public.is_delivery_ops(auth.uid()));

-- ===== payouts =====
CREATE TABLE public.rider_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.delivery_riders(id) ON DELETE RESTRICT,
  amount_ghs numeric NOT NULL,
  delivery_count integer NOT NULL DEFAULT 0,
  period_start date,
  period_end date,
  method public.rider_payout_method NOT NULL,
  reference text,
  notes text,
  processed_by uuid,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rider_payouts_rider_idx ON public.rider_payouts(rider_id, processed_at DESC);
GRANT SELECT ON public.rider_payouts TO authenticated;
GRANT ALL ON public.rider_payouts TO service_role;
ALTER TABLE public.rider_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riders read own payouts"
  ON public.rider_payouts FOR SELECT TO authenticated
  USING (rider_id = public.current_rider_id() OR public.is_delivery_ops(auth.uid()));
CREATE POLICY "ops manage payouts"
  ON public.rider_payouts FOR ALL TO authenticated
  USING (public.is_delivery_ops(auth.uid()))
  WITH CHECK (public.is_delivery_ops(auth.uid()));

CREATE TABLE public.rider_payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.rider_payouts(id) ON DELETE CASCADE,
  earning_id uuid NOT NULL REFERENCES public.rider_earnings(id) ON DELETE RESTRICT,
  amount_ghs numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (earning_id)
);
GRANT SELECT ON public.rider_payout_items TO authenticated;
GRANT ALL ON public.rider_payout_items TO service_role;
ALTER TABLE public.rider_payout_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout items visible to rider and ops"
  ON public.rider_payout_items FOR SELECT TO authenticated
  USING (
    public.is_delivery_ops(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rider_payouts p
      WHERE p.id = payout_id AND p.rider_id = public.current_rider_id()
    )
  );
CREATE POLICY "ops manage payout items"
  ON public.rider_payout_items FOR ALL TO authenticated
  USING (public.is_delivery_ops(auth.uid()))
  WITH CHECK (public.is_delivery_ops(auth.uid()));

ALTER TABLE public.rider_earnings
  ADD CONSTRAINT rider_earnings_payout_fk
  FOREIGN KEY (payout_id) REFERENCES public.rider_payouts(id) ON DELETE SET NULL;

-- ===== cash on delivery remittance =====
CREATE TABLE public.cod_remittances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL UNIQUE REFERENCES public.deliveries(id) ON DELETE CASCADE,
  food_order_id uuid REFERENCES public.food_orders(id) ON DELETE SET NULL,
  rider_id uuid REFERENCES public.delivery_riders(id) ON DELETE SET NULL,
  amount_due_ghs numeric NOT NULL DEFAULT 0,
  cash_collected_ghs numeric NOT NULL DEFAULT 0,
  amount_remitted_ghs numeric NOT NULL DEFAULT 0,
  outstanding_ghs numeric NOT NULL DEFAULT 0,
  collected_at timestamptz,
  confirmed_by uuid,
  confirmed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cod_remittances_rider_idx ON public.cod_remittances(rider_id, created_at DESC);
GRANT SELECT ON public.cod_remittances TO authenticated;
GRANT ALL ON public.cod_remittances TO service_role;
ALTER TABLE public.cod_remittances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cod visible to rider and staff"
  ON public.cod_remittances FOR SELECT TO authenticated
  USING (rider_id = public.current_rider_id() OR public.is_delivery_staff(auth.uid()));
CREATE POLICY "ops manage cod"
  ON public.cod_remittances FOR ALL TO authenticated
  USING (public.is_delivery_ops(auth.uid()))
  WITH CHECK (public.is_delivery_ops(auth.uid()));

-- ===== integrity triggers =====
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_comp_rules_updated BEFORE UPDATE ON public.rider_compensation_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_rider_earnings_updated BEFORE UPDATE ON public.rider_earnings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_cod_updated BEFORE UPDATE ON public.cod_remittances
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.validate_rider_earning()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  allowed text[];
BEGIN
  IF NEW.customer_fee_ghs < 0 OR NEW.base_earning_ghs < 0 OR NEW.earning_ghs < 0 OR NEW.distance_km < 0 THEN
    RAISE EXCEPTION 'Amounts cannot be negative';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'paid' AND NEW.status = 'paid'
       AND (NEW.earning_ghs IS DISTINCT FROM OLD.earning_ghs
            OR NEW.base_earning_ghs IS DISTINCT FROM OLD.base_earning_ghs) THEN
      RAISE EXCEPTION 'A paid earning cannot be edited; record an adjustment instead';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      allowed := CASE OLD.status::text
        WHEN 'pending'  THEN ARRAY['approved','disputed','adjusted']
        WHEN 'approved' THEN ARRAY['payable','disputed','adjusted','pending']
        WHEN 'payable'  THEN ARRAY['paid','disputed','adjusted','approved']
        WHEN 'paid'     THEN ARRAY['disputed']
        WHEN 'disputed' THEN ARRAY['pending','approved','adjusted']
        WHEN 'adjusted' THEN ARRAY['approved','payable','disputed']
        ELSE ARRAY[]::text[]
      END;
      IF NOT (NEW.status::text = ANY(allowed)) THEN
        RAISE EXCEPTION 'Cannot move an earning from % to %', OLD.status, NEW.status;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_rider_earning
  BEFORE INSERT OR UPDATE ON public.rider_earnings
  FOR EACH ROW EXECUTE FUNCTION public.validate_rider_earning();

CREATE OR REPLACE FUNCTION public.validate_rider_payout()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.amount_ghs <= 0 THEN RAISE EXCEPTION 'Payout amount must be greater than zero'; END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_rider_payout
  BEFORE INSERT OR UPDATE ON public.rider_payouts
  FOR EACH ROW EXECUTE FUNCTION public.validate_rider_payout();

-- keep the earning total in step with its adjustments
CREATE OR REPLACE FUNCTION public.apply_earning_adjustment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.rider_earnings e
  SET adjustment_total_ghs = e.adjustment_total_ghs + NEW.delta_ghs,
      earning_ghs = GREATEST(0, ROUND((e.earning_ghs + NEW.delta_ghs)::numeric, 2)),
      status = CASE WHEN e.status = 'paid' THEN e.status ELSE 'adjusted'::public.rider_earning_status END
  WHERE e.id = NEW.earning_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_apply_earning_adjustment
  AFTER INSERT ON public.rider_earning_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.apply_earning_adjustment();

-- seed a sensible default rule
INSERT INTO public.rider_compensation_rules
  (model, base_ghs, per_km_ghs, percent_of_fee, min_earning_ghs, max_earning_ghs, is_active, note)
VALUES ('hybrid', 10, 2, 0, 10, 150, true, 'Default rule');