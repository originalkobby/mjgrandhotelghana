DROP POLICY IF EXISTS "Staff can view and manage food orders" ON public.food_orders;
CREATE POLICY "Staff can view and manage food orders"
ON public.food_orders FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operations_manager'::app_role)
  OR has_role(auth.uid(), 'front_desk'::app_role)
  OR has_role(auth.uid(), 'restaurant_staff'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operations_manager'::app_role)
  OR has_role(auth.uid(), 'front_desk'::app_role)
  OR has_role(auth.uid(), 'restaurant_staff'::app_role)
);

DROP POLICY IF EXISTS "Staff can manage food order items" ON public.food_order_items;
CREATE POLICY "Staff can manage food order items"
ON public.food_order_items FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operations_manager'::app_role)
  OR has_role(auth.uid(), 'front_desk'::app_role)
  OR has_role(auth.uid(), 'restaurant_staff'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operations_manager'::app_role)
  OR has_role(auth.uid(), 'front_desk'::app_role)
  OR has_role(auth.uid(), 'restaurant_staff'::app_role)
);