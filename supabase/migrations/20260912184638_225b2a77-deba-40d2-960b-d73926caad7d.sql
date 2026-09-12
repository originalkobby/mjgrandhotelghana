CREATE OR REPLACE FUNCTION public.rider_has_open_offer(_delivery_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.delivery_offers o
    WHERE o.delivery_id = _delivery_id
      AND o.rider_id = public.current_rider_id()
      AND o.status = 'offered'
      AND o.expires_at > now()
  )
$$;

REVOKE EXECUTE ON FUNCTION public.rider_has_open_offer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rider_has_open_offer(uuid) TO authenticated;

CREATE POLICY "Riders can view deliveries they are offered"
  ON public.deliveries FOR SELECT TO authenticated
  USING (public.rider_has_open_offer(id));

CREATE POLICY "Riders can view orders they are offered"
  ON public.food_orders FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deliveries d
    WHERE d.food_order_id = food_orders.id
      AND public.rider_has_open_offer(d.id)
  ));