import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  DollarSign,
  BedDouble,
  Target,
  RefreshCw,
  Bell,
  X,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays, differenceInDays } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */

interface Forecast {
  forecast_date: string;
  room_id: string | null;
  expected_occupancy: number;
  recommended_price: number | null;
  predicted_revenue: number | null;
  confidence_level: number;
  rooms?: { name: string } | null;
}

interface DemandAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  date_start: string;
  date_end: string;
  recommended_action: string | null;
  is_dismissed: boolean;
  created_at: string;
  rooms?: { name: string } | null;
}

interface RevenueTarget {
  sixMonthTarget: number;
  currentRevenue: number;
  projectedRevenue: number;
  daysElapsed: number;
  daysTotal: number;
  dailyNeeded: number;
  onTrack: boolean;
}

/* ─── Data Fetching ─── */

async function fetchRevenueIntelligence() {
  const today = new Date();
  const thirtyDaysAhead = format(addDays(today, 30), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");
  const sixMonthsAgo = format(subDays(today, 180), "yyyy-MM-dd");

  const [
    { data: forecasts },
    { data: alerts },
    { data: bookings },
    { data: rooms },
    { data: inventory },
  ] = await Promise.all([
    supabase
      .from("revenue_forecasts")
      .select("*, rooms(name)")
      .gte("forecast_date", todayStr)
      .lte("forecast_date", thirtyDaysAhead)
      .order("forecast_date"),
    supabase
      .from("demand_alerts")
      .select("*, rooms(name)")
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("bookings")
      .select("final_total_ghs, payment_status, created_at, check_in, check_out, booking_source, discount_ghs, base_total_ghs, room_id, rooms(name)")
      .gte("created_at", sixMonthsAgo),
    supabase
      .from("rooms")
      .select("id, name, base_price_ghs")
      .eq("is_active", true),
    supabase
      .from("room_inventory")
      .select("room_id, date, booked_count, total_count, rate_override, is_closed")
      .gte("date", todayStr)
      .lte("date", thirtyDaysAhead),
  ]);

  return {
    forecasts: (forecasts as unknown as Forecast[]) ?? [],
    alerts: (alerts as unknown as DemandAlert[]) ?? [],
    bookings: bookings ?? [],
    rooms: rooms ?? [],
    inventory: inventory ?? [],
  };
}

/* ─── Component ─── */

export default function RevenueIntelligence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["revenue-intelligence"],
    queryFn: fetchRevenueIntelligence,
    staleTime: 60_000,
  });

  const forecasts = data?.forecasts ?? [];
  const alerts = data?.alerts ?? [];
  const bookings = data?.bookings ?? [];
  const rooms = data?.rooms ?? [];
  const inventory = data?.inventory ?? [];

  // Calculate revenue target tracking ($1M / 6 months)
  const TARGET_6M = 16_000_000; // GHS (~$1M USD)
  const today = new Date();
  const periodStart = subDays(today, 180);
  const daysElapsed = differenceInDays(today, periodStart);
  const paidRevenue = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((s, b) => s + Number(b.final_total_ghs), 0);
  const dailyRate = daysElapsed > 0 ? paidRevenue / daysElapsed : 0;
  const projectedRevenue = dailyRate * 180;
  const dailyNeeded =
    daysElapsed < 180 ? (TARGET_6M - paidRevenue) / (180 - daysElapsed) : 0;
  const onTrack = projectedRevenue >= TARGET_6M;

  // Build occupancy forecast chart from inventory data
  const occupancyChartData: { date: string; occupancy: number; recommended: number }[] = [];
  const dateMap = new Map<string, { booked: number; total: number }>();
  for (const inv of inventory) {
    if (inv.is_closed) continue;
    const existing = dateMap.get(inv.date) ?? { booked: 0, total: 0 };
    existing.booked += inv.booked_count;
    existing.total += inv.total_count;
    dateMap.set(inv.date, existing);
  }

  // Merge with forecast data
  const forecastMap = new Map<string, { occupancy: number; price: number }>();
  for (const f of forecasts) {
    if (!f.room_id) {
      forecastMap.set(f.forecast_date, {
        occupancy: Number(f.expected_occupancy),
        price: Number(f.recommended_price) || 0,
      });
    }
  }

  for (let d = 0; d < 30; d++) {
    const dateStr = format(addDays(today, d), "yyyy-MM-dd");
    const label = format(addDays(today, d), "dd/MM");
    const inv = dateMap.get(dateStr);
    const fc = forecastMap.get(dateStr);

    const actualOcc =
      inv && inv.total > 0 ? Math.round((inv.booked / inv.total) * 100) : 0;
    const forecastOcc = fc ? Math.round(fc.occupancy * 100) : actualOcc;

    occupancyChartData.push({
      date: label,
      occupancy: actualOcc,
      recommended: forecastOcc,
    });
  }

  // Revenue by source
  const sourceRevenue = new Map<string, number>();
  for (const b of bookings) {
    if (b.payment_status !== "paid") continue;
    const src = (b.booking_source as string) || "direct";
    sourceRevenue.set(src, (sourceRevenue.get(src) ?? 0) + Number(b.final_total_ghs));
  }
  const sourceChartData = Array.from(sourceRevenue.entries())
    .map(([source, revenue]) => ({ source: source.charAt(0).toUpperCase() + source.slice(1), revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Revenue by room type
  const roomRevenue = new Map<string, number>();
  for (const b of bookings) {
    if (b.payment_status !== "paid") continue;
    const roomName = (b.rooms as any)?.name || "Unknown";
    roomRevenue.set(roomName, (roomRevenue.get(roomName) ?? 0) + Number(b.final_total_ghs));
  }
  const roomChartData = Array.from(roomRevenue.entries())
    .map(([room, revenue]) => ({ room, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // KPIs
  const totalBookings = bookings.length;
  const paidBookings = bookings.filter((b) => b.payment_status === "paid").length;
  const adr = paidBookings > 0 ? paidRevenue / paidBookings : 0;
  const totalRoomNights = rooms.length * 180;
  const bookedNights = bookings.reduce((sum, b) => {
    const nights = differenceInDays(new Date(b.check_out), new Date(b.check_in));
    return sum + Math.max(nights, 1);
  }, 0);
  const revpar = totalRoomNights > 0 ? paidRevenue / totalRoomNights : 0;

  // Discount leakage
  const totalDiscount = bookings.reduce((s, b) => s + Number(b.discount_ghs || 0), 0);

  const dismissAlert = async (id: string) => {
    await supabase
      .from("demand_alerts")
      .update({ is_dismissed: true })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["revenue-intelligence"] });
  };

  const runPricingEngine = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dynamic-pricing`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ days_ahead: 30 }),
        }
      );
      const data = await res.json();
      toast({
        title: "Dynamic Pricing Updated",
        description: `${data.updated} rates recalculated across ${data.rooms} rooms.`,
      });
      queryClient.invalidateQueries({ queryKey: ["revenue-intelligence"] });
    } catch {
      toast({ title: "Error", description: "Failed to run pricing engine", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-muted rounded-lg" />)}
        </div>
        <div className="h-72 bg-muted rounded-lg" />
      </div>
    );
  }

  const ALERT_ICONS: Record<string, React.ElementType> = {
    low_demand: TrendingDown,
    high_demand: TrendingUp,
    surge: Zap,
    opportunity: Target,
  };

  const ALERT_COLORS: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-gold-light/20 text-gold-dark border-gold-light/30",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const SEVERITY_BADGE: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-gold-light/20 text-gold-dark",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">
            Revenue Intelligence
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            AI-powered revenue optimization • Target: GH₵ {TARGET_6M.toLocaleString()} / 6 months
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runPricingEngine} variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-1" /> Run Pricing Engine
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["revenue-intelligence"] })}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Revenue Target Tracker */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${onTrack ? "border-accent/40" : "border-destructive/40"}`}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${onTrack ? "bg-accent/10" : "bg-destructive/10"}`}>
                  <Target className={`w-6 h-6 ${onTrack ? "text-accent" : "text-destructive"}`} />
                </div>
                <div>
                  <p className="font-sans text-sm text-muted-foreground">
                    6-Month Revenue Target
                  </p>
                  <p className="font-serif text-2xl text-foreground">
                    GH₵ {paidRevenue.toLocaleString()}{" "}
                    <span className="text-muted-foreground text-base">
                      / {TARGET_6M.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-sans">
                <div className="text-center">
                  <p className="text-muted-foreground">Progress</p>
                  <p className="font-medium text-foreground">
                    {Math.round((paidRevenue / TARGET_6M) * 100)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Daily Rate</p>
                  <p className="font-medium text-foreground">
                    GH₵ {Math.round(dailyRate).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Needed/Day</p>
                  <p className={`font-medium ${dailyNeeded > dailyRate ? "text-destructive" : "text-accent"}`}>
                    GH₵ {Math.round(dailyNeeded).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Projected</p>
                  <p className={`font-medium ${onTrack ? "text-accent" : "text-destructive"}`}>
                    GH₵ {Math.round(projectedRevenue).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${onTrack ? "bg-accent" : "bg-destructive"}`}
                style={{ width: `${Math.min((paidRevenue / TARGET_6M) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Revenue (180d)", value: `GH₵ ${Math.round(paidRevenue).toLocaleString()}`, icon: DollarSign, color: "text-accent" },
          { label: "ADR", value: `GH₵ ${Math.round(adr).toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
          { label: "RevPAR", value: `GH₵ ${Math.round(revpar).toLocaleString()}`, icon: BarChart3, color: "text-primary" },
          { label: "Bookings", value: totalBookings.toString(), icon: BedDouble, color: "text-muted-foreground" },
          { label: "Discount Leakage", value: `GH₵ ${Math.round(totalDiscount).toLocaleString()}`, icon: AlertTriangle, color: totalDiscount > paidRevenue * 0.1 ? "text-destructive" : "text-muted-foreground" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-sans text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <p className="font-serif text-xl text-foreground">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Demand Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="h-4 w-4 text-gold-dark" />
          <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
            Demand Alerts ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No active demand alerts. Alerts will appear when forecast data detects demand shifts.
            </p>
          ) : (
            alerts.slice(0, 10).map((alert) => {
              const Icon = ALERT_ICONS[alert.alert_type] || AlertTriangle;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${ALERT_COLORS[alert.severity] ?? "bg-muted"}`}
                >
                  <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-sans text-sm font-medium">{alert.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider font-semibold ${SEVERITY_BADGE[alert.severity] ?? "bg-muted"}`}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    {alert.description && (
                      <p className="font-sans text-xs text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    )}
                    {alert.recommended_action && (
                      <p className="font-sans text-xs font-medium mt-1">
                        💡 {alert.recommended_action}
                      </p>
                    )}
                    <p className="font-sans text-xs text-muted-foreground mt-1">
                      {format(new Date(alert.date_start), "dd/MM")} → {format(new Date(alert.date_end), "dd/MM")}
                      {alert.rooms?.name && ` • ${alert.rooms.name}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="w-3 h-3" /> Dismiss
                  </Button>
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
              30-Day Occupancy Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fontFamily: "DM Sans" }}
                    stroke="hsl(30 8% 45%)"
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "DM Sans" }}
                    stroke="hsl(30 8% 45%)"
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === "occupancy" ? "Current" : "Forecast",
                    ]}
                    contentStyle={{ fontFamily: "DM Sans", fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: "DM Sans", fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="occupancy"
                    stroke="hsl(38 60% 52%)"
                    fill="hsl(38 60% 52% / 0.2)"
                    name="Current Bookings"
                  />
                  <Area
                    type="monotone"
                    dataKey="recommended"
                    stroke="hsl(150 50% 40%)"
                    fill="hsl(150 50% 40% / 0.1)"
                    strokeDasharray="5 5"
                    name="Predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
              Revenue by Booking Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fontFamily: "DM Sans" }}
                    stroke="hsl(30 8% 45%)"
                    tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    dataKey="source"
                    type="category"
                    tick={{ fontSize: 10, fontFamily: "DM Sans" }}
                    stroke="hsl(30 8% 45%)"
                    width={90}
                  />
                  <Tooltip
                    formatter={(value: number) => [`GH₵ ${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ fontFamily: "DM Sans", fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="revenue" fill="hsl(38 60% 52%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Room Type */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
              Revenue by Room Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                  <XAxis
                    dataKey="room"
                    tick={{ fontSize: 10, fontFamily: "DM Sans" }}
                    stroke="hsl(30 8% 45%)"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "DM Sans" }}
                    stroke="hsl(30 8% 45%)"
                    tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`GH₵ ${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ fontFamily: "DM Sans", fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="revenue" fill="hsl(150 50% 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Room Pricing Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
              Current Room Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rooms.map((room) => {
                const roomInv = inventory.filter(
                  (inv) => inv.room_id === room.id && !inv.is_closed
                );
                const avgRate =
                  roomInv.length > 0
                    ? roomInv.reduce(
                        (s, inv) =>
                          s + (inv.rate_override ? Number(inv.rate_override) : Number(room.base_price_ghs)),
                        0
                      ) / roomInv.length
                    : Number(room.base_price_ghs);
                const avgOcc =
                  roomInv.length > 0
                    ? roomInv.reduce(
                        (s, inv) =>
                          s +
                          (inv.total_count > 0
                            ? inv.booked_count / inv.total_count
                            : 0),
                        0
                      ) / roomInv.length
                    : 0;
                const priceDiff =
                  ((avgRate - Number(room.base_price_ghs)) /
                    Number(room.base_price_ghs)) *
                  100;

                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div>
                      <p className="font-sans text-sm font-medium text-foreground">
                        {room.name}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground">
                        Base: GH₵ {Number(room.base_price_ghs).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-sans text-sm font-medium text-foreground">
                        GH₵ {Math.round(avgRate).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`flex items-center gap-0.5 ${priceDiff > 0 ? "text-accent" : priceDiff < 0 ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {priceDiff > 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : priceDiff < 0 ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : null}
                          {Math.abs(Math.round(priceDiff))}%
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round(avgOcc * 100)}% occ
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Colab Integration Guide */}
      <Card className="border-dashed border-2 border-border">
        <CardHeader>
          <CardTitle className="font-sans text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="h-4 w-4" /> Google Colab Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-sans text-sm text-muted-foreground space-y-2">
            <p>Push forecast data from your Prophet model using this endpoint:</p>
            <code className="block bg-muted p-3 rounded text-xs break-all">
              POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-forecast
            </code>
            <p className="text-xs">
              Headers: <code>x-forecast-key: YOUR_OTA_WEBHOOK_SECRET</code>
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-foreground">
                Example Python code
              </summary>
              <pre className="mt-2 bg-muted p-3 rounded text-xs overflow-x-auto whitespace-pre">
{`import requests

url = "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-forecast"
headers = {
    "x-forecast-key": "YOUR_SECRET",
    "Content-Type": "application/json"
}
payload = {
    "model_version": "prophet-v1",
    "forecasts": [
        {
            "date": "2026-04-01",
            "room_id": null,  # null for aggregate
            "expected_occupancy": 0.72,
            "recommended_price": 850,
            "predicted_revenue": 12000
        }
    ],
    "alerts": [
        {
            "alert_type": "low_demand",
            "severity": "high",
            "title": "Low midweek demand expected",
            "description": "Occupancy below 40% predicted Apr 7-10",
            "date_start": "2026-04-07",
            "date_end": "2026-04-10",
            "recommended_action": "Launch corporate packages"
        }
    ]
}
r = requests.post(url, json=payload, headers=headers)
print(r.json())`}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
