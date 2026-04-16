
-- =============================================================
-- Fix PII exposure: restrict guests, conversations, support_tickets
-- Fix public cancel policy on bookings
-- Fix promotions public exposure
-- =============================================================

-- 1. DROP overly permissive policies on guests
DROP POLICY IF EXISTS "Anyone can read guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can update guests" ON public.guests;
DROP POLICY IF EXISTS "Public can select guests by email" ON public.guests;

-- Add admin/front_desk SELECT on guests
CREATE POLICY "Staff can view guests"
  ON public.guests FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'front_desk'::app_role)
  );

-- Add admin/front_desk UPDATE on guests
CREATE POLICY "Staff can update guests"
  ON public.guests FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'front_desk'::app_role)
  );

-- Keep public INSERT for booking flow (guest upsert happens via service role in edge function, but anon insert policy exists)
-- Already exists: "Public can insert guests"

-- 2. DROP overly permissive policies on conversations
DROP POLICY IF EXISTS "Anyone can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.conversations;

-- Add staff-only SELECT on conversations
CREATE POLICY "Staff can view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'front_desk'::app_role)
  );

-- Add INSERT for the mj-ai edge function (uses service role, but need anon for realtime inserts)
CREATE POLICY "Public can insert conversations"
  ON public.conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. DROP overly permissive policies on support_tickets
DROP POLICY IF EXISTS "Anyone can read support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can update support_tickets" ON public.support_tickets;

-- Add staff-only SELECT on support_tickets
CREATE POLICY "Staff can view support tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'front_desk'::app_role)
  );

-- Add staff-only UPDATE on support_tickets
CREATE POLICY "Staff can update support tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'front_desk'::app_role)
  );

-- Add INSERT for the mj-ai edge function
CREATE POLICY "Public can insert support tickets"
  ON public.support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Remove the public cancel policy on bookings (cancellation now goes through edge function)
DROP POLICY IF EXISTS "Public can cancel bookings" ON public.bookings;

-- 5. Remove public SELECT on promotions (promo validation is done server-side in create-booking)
DROP POLICY IF EXISTS "Public can view active promos" ON public.promotions;
