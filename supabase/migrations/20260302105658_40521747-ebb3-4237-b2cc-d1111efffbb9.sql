
-- ==========================================
-- MJ Grand Hotel Booking Engine Schema
-- ==========================================

-- 1. App Roles Enum & User Roles Table
CREATE TYPE public.app_role AS ENUM ('admin', 'revenue_manager', 'front_desk', 'finance');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. Admin Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  size_sqm INTEGER,
  bed_type TEXT,
  max_adults INTEGER NOT NULL DEFAULT 2,
  max_children INTEGER NOT NULL DEFAULT 1,
  base_price_ghs NUMERIC(10,2) NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active rooms" ON public.rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage rooms" ON public.rooms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Room Inventory (per-date availability)
CREATE TABLE public.room_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 1,
  booked_count INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  min_stay INTEGER NOT NULL DEFAULT 1,
  rate_override NUMERIC(10,2),
  UNIQUE (room_id, date)
);
ALTER TABLE public.room_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view inventory" ON public.room_inventory FOR SELECT USING (true);
CREATE POLICY "Admins can manage inventory" ON public.room_inventory FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Seasonal Pricing
CREATE TABLE public.seasonal_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rate_multiplier NUMERIC(4,2) DEFAULT 1.0,
  rate_override NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.seasonal_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view seasonal pricing" ON public.seasonal_pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage seasonal pricing" ON public.seasonal_pricing FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. Cancellation Policies
CREATE TABLE public.cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  refund_percentage INTEGER NOT NULL DEFAULT 100,
  deadline_hours INTEGER NOT NULL DEFAULT 48,
  is_default BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view policies" ON public.cancellation_policies FOR SELECT USING (true);
CREATE POLICY "Admins can manage policies" ON public.cancellation_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7. Add-Ons
CREATE TABLE public.add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_ghs NUMERIC(10,2) NOT NULL,
  icon TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view add-ons" ON public.add_ons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage add-ons" ON public.add_ons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8. Promotions
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  start_date DATE,
  end_date DATE,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  room_restrictions UUID[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active promos" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage promos" ON public.promotions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 9. Bookings
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded', 'failed');

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT UNIQUE NOT NULL,
  guest_id UUID REFERENCES public.guests(id),
  room_id UUID REFERENCES public.rooms(id) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  base_total_ghs NUMERIC(10,2) NOT NULL,
  add_ons_total_ghs NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_ghs NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_total_ghs NUMERIC(10,2) NOT NULL,
  promo_code TEXT,
  special_requests TEXT,
  arrival_time TEXT,
  nationality TEXT,
  cancellation_policy_id UUID REFERENCES public.cancellation_policies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revenue_manager') OR public.has_role(auth.uid(), 'front_desk') OR public.has_role(auth.uid(), 'finance'));
CREATE POLICY "Admins can manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'front_desk'));
CREATE POLICY "Public can insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);

-- 10. Booking Add-Ons
CREATE TABLE public.booking_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  add_on_id UUID REFERENCES public.add_ons(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_ghs NUMERIC(10,2) NOT NULL,
  total_price_ghs NUMERIC(10,2) NOT NULL
);
ALTER TABLE public.booking_add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view booking add-ons" ON public.booking_add_ons FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'front_desk'));
CREATE POLICY "Public can insert booking add-ons" ON public.booking_add_ons FOR INSERT WITH CHECK (true);

-- 11. Payment Logs
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_reference TEXT,
  amount_ghs NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GHS',
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view payment logs" ON public.payment_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));
CREATE POLICY "Public can insert payment logs" ON public.payment_logs FOR INSERT WITH CHECK (true);

-- 12. Generate booking reference function
CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'MJ-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));
  RETURN ref;
END;
$$;
