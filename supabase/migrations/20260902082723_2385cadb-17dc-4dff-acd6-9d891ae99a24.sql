-- Remove front_desk from staff policies on food_orders and food_order_items

DROP POLICY "Staff can view food orders" ON public.food_orders;
CREATE POLICY "Staff can view food orders" ON public.food_orders
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'operations_manager')
  OR has_role(auth.uid(), 'restaurant_staff')
);

DROP POLICY "Staff can insert food orders" ON public.food_orders;
CREATE POLICY "Staff can insert food orders" ON public.food_orders
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'operations_manager')
  OR has_role(auth.uid(), 'restaurant_staff')
);

DROP POLICY "Staff can update food orders" ON public.food_orders;
CREATE POLICY "Staff can update food orders" ON public.food_orders
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'operations_manager')
  OR has_role(auth.uid(), 'restaurant_staff')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'operations_manager')
  OR has_role(auth.uid(), 'restaurant_staff')
);

DROP POLICY "Staff can view food order items" ON public.food_order_items;
CREATE POLICY "Staff can view food order items" ON public.food_order_items
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'operations_manager')
  OR has_role(auth.uid(), 'restaurant_staff')
);

DROP POLICY "Staff can insert food order items" ON public.food_order_items;
CREATE POLICY "Staff can insert food order items" ON public.food_order_items
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'operations_manager')
  OR has_role(auth.uid(), 'restaurant_staff')
);

DROP POLICY "Staff can update food order items" ON public.food_order_items;
CREATE POLICY "Staff can update food order items" ON public.food_order_items
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'operations_manager')
  OR has_role(auth.uid(), 'restaurant_staff')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'operations_manager')
  OR has_role(auth.uid(), 'restaurant_staff')
);