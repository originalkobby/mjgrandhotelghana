
-- Revenue forecasts table (populated by Google Colab)
CREATE TABLE public.revenue_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_date DATE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  expected_occupancy NUMERIC NOT NULL DEFAULT 0,
  recommended_price NUMERIC,
  predicted_revenue NUMERIC,
  confidence_level NUMERIC DEFAULT 0.8,
  model_version TEXT DEFAULT 'v1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(forecast_date, room_id)
);

-- Demand alerts table
CREATE TABLE public.demand_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_demand', 'high_demand', 'surge', 'opportunity')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  recommended_action TEXT,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Revenue streams tracking
CREATE TABLE public.revenue_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_type TEXT NOT NULL CHECK (stream_type IN ('rooms', 'restaurant', 'events', 'add_ons', 'services')),
  amount_ghs NUMERIC NOT NULL DEFAULT 0,
  record_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_streams ENABLE ROW LEVEL SECURITY;

-- Forecasts: admins/revenue_manager can manage, public read for pricing
CREATE POLICY "Admins can manage forecasts" ON public.revenue_forecasts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revenue_manager'::app_role));
CREATE POLICY "Public can view forecasts" ON public.revenue_forecasts FOR SELECT TO public USING (true);

-- Alerts: admins/revenue_manager can manage
CREATE POLICY "Admins can manage alerts" ON public.demand_alerts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revenue_manager'::app_role));

-- Revenue streams: admins can manage
CREATE POLICY "Admins can manage revenue streams" ON public.revenue_streams FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'revenue_manager'::app_role) OR has_role(auth.uid(), 'finance'::app_role));

-- Insert policy for edge functions (anon)
CREATE POLICY "Service can insert forecasts" ON public.revenue_forecasts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Service can insert alerts" ON public.demand_alerts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Service can insert revenue streams" ON public.revenue_streams FOR INSERT TO anon WITH CHECK (true);
