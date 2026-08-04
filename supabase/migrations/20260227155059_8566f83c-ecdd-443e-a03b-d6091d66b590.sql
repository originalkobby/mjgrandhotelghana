
-- Drop overly permissive public policies on guests
DROP POLICY IF EXISTS "Anyone can read guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can insert guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can update guests" ON public.guests;

-- Drop overly permissive public policies on conversations
DROP POLICY IF EXISTS "Anyone can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.conversations;

-- Drop overly permissive public policies on support_tickets
DROP POLICY IF EXISTS "Anyone can read support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can insert support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can update support_tickets" ON public.support_tickets;

-- Service role bypasses RLS, so the edge function (using service role key) 
-- can still read/write. No public access policies needed.
-- If admin dashboard access is needed later, add authenticated admin policies.
