DO $$ BEGIN
  CREATE TYPE public.delivery_offer_status AS ENUM ('offered','accepted','declined','expired','superseded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.dispatch_state AS ENUM ('idle','offering','assigned','needs_rider');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.delivery_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES public.delivery_riders(id) ON DELETE CASCADE,
  attempt integer NOT NULL DEFAULT 1,
  status public.delivery_offer_status NOT NULL DEFAULT 'offered',
  distance_km numeric NOT NULL DEFAULT 0,
  estimated_earning_ghs numeric NOT NULL DEFAULT 0,
  offered_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  responded_at timestamptz,
  decline_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (delivery_id, rider_id, attempt)
);

GRANT SELECT ON public.delivery_offers TO authenticated;
GRANT ALL ON public.delivery_offers TO service_role;

ALTER TABLE public.delivery_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders see their own offers"
  ON public.delivery_offers FOR SELECT TO authenticated
  USING (rider_id = public.current_rider_id());

CREATE POLICY "Delivery staff see all offers"
  ON public.delivery_offers FOR SELECT TO authenticated
  USING (public.is_delivery_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS delivery_offers_open_idx
  ON public.delivery_offers (rider_id, status) WHERE status = 'offered';
CREATE INDEX IF NOT EXISTS delivery_offers_delivery_idx
  ON public.delivery_offers (delivery_id);

CREATE TRIGGER trg_delivery_offers_updated
  BEFORE UPDATE ON public.delivery_offers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Only one accepted offer can ever exist per delivery.
CREATE UNIQUE INDEX IF NOT EXISTS delivery_offers_one_accepted_idx
  ON public.delivery_offers (delivery_id) WHERE status = 'accepted';

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS dispatch_state public.dispatch_state NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS dispatch_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE public.delivery_settings
  ADD COLUMN IF NOT EXISTS offer_timeout_seconds smallint NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_dispatch_attempts smallint NOT NULL DEFAULT 3;

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_offers;