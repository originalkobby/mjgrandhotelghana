import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  BedDouble,
  TrendingUp,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { formatDateGB } from "@/lib/dateUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatBookingLabel, getPaymentDisplay } from "@/lib/bookingLifecycle";
import { useBookingLifecycleSync } from "@/hooks/useBookingLifecycleSync";
import { useCurrency } from "@/contexts/CurrencyContext";

interface KPI {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
}

interface Booking {
  id: string;
  reference_code: string;
  status: string;
  payment_status: string;
  check_in: string;
  check_out: string;
  final_total_ghs: number;
  created_at: string;
  rooms: { name: string } | null;
  guests: { full_name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-accent/20 text-accent border-accent/30",
  pending: "bg-gold-light/20 text-gold-dark border-gold-light/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-accent/20 text-accent border-accent/30",
  no_show: "bg-muted text-muted-foreground border-border",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-accent/20 text-accent",
  pending: "bg-gold-light/20 text-gold-dark",
  failed: "bg-destructive/10 text-destructive",
  partial: "bg-gold-light/20 text-gold-dark",
  refunded: "bg-muted text-muted-foreground",
};

async function fetchOverviewData(dateFrom: string, dateTo: string) {
  const prevDuration = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
  const prevFrom = format(new Date(new Date(dateFrom).getTime() - prevDuration), "yyyy-MM-dd");
  const prevTo = format(new Date(new Date(dateTo).getTime() - prevDuration), "yyyy-MM-dd");

  const [{ data: currentBookings }, { data: prevBookings }, { data: recent }] = await Promise.all([
    supabase
      .from("bookings")
      .select("final_total_ghs, status, payment_status, check_in, check_out, created_at")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo + "T23:59:59"),
    supabase
      .from("bookings")
      .select("final_total_ghs, status, payment_status")
      .gte("created_at", prevFrom)
      .lte("created_at", prevTo + "T23:59:59"),
    supabase
      .from("bookings")
      .select("id, reference_code, status, payment_status, check_in, check_out, final_total_ghs, created_at, rooms(name), guests(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const curr = currentBookings ?? [];
  const prev = prevBookings ?? [];

  const totalRevenue = curr
    .filter((b) => b.payment_status === "paid")
    .reduce((s, b) => s + Number(b.final_total_ghs), 0);
  const prevRevenue = prev
    .filter((b) => b.payment_status === "paid")
    .reduce((s, b) => s + Number(b.final_total_ghs), 0);

  const totalBookings = curr.length;
  const prevTotalBookings = prev.length;

  const confirmed = curr.filter((b) => b.status === "confirmed" || b.status === "completed").length;
  const paidCount = curr.filter((b) => b.payment_status === "paid").length;
  const adr = paidCount > 0 ? totalRevenue / paidCount : 0;
  const prevPaidCount = prev.filter((b) => b.payment_status === "paid").length;
  const prevAdr = prevPaidCount > 0 ? prevRevenue / prevPaidCount : 0;

  const pctChange = (c: number, p: number) => (p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100));

  const now = new Date(dateTo);
  const chartData: { day: string; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = format(subDays(now, i), "yyyy-MM-dd");
    const dayLabel = format(subDays(now, i), "dd/MM");
    const dayRevenue = curr
      .filter((b) => b.created_at.startsWith(d) && b.payment_status === "paid")
      .reduce((s, b) => s + Number(b.final_total_ghs), 0);
    chartData.push({ day: dayLabel, revenue: dayRevenue });
  }

  return {
    totalRevenue,
    prevRevenue,
    totalBookings,
    prevTotalBookings,
    confirmed,
    adr,
    prevAdr,
    pctChange,
    chartData,
    recentBookings: (recent as unknown as Booking[]) ?? [],
  };
}

export default function Overview() {
  const queryClient = useQueryClient();
  const { format: fc } = useCurrency();
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-overview", dateFrom, dateTo],
    queryFn: () => fetchOverviewData(dateFrom, dateTo),
    staleTime: 60_000,
  });

  useBookingLifecycleSync({
    onSynced: () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
  });

  const chartData = data?.chartData ?? [];
  const recentBookings = data?.recentBookings ?? [];
  const refreshing = isLoading || isFetching;

  const kpis: KPI[] = data ? [
    { label: "Total Revenue", value: fc(data.totalRevenue), change: data.pctChange(data.totalRevenue, data.prevRevenue), icon: DollarSign },
    { label: "Bookings", value: data.totalBookings.toString(), change: data.pctChange(data.totalBookings, data.prevTotalBookings), icon: CalendarCheck },
    { label: "Confirmed", value: data.confirmed.toString(), change: 0, icon: BedDouble },
    { label: "Avg. Daily Rate", value: fc(Math.round(data.adr)), change: data.pctChange(data.adr, data.prevAdr), icon: TrendingUp },
  ] : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-72 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">Dashboard</h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Performance overview
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 text-xs"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-overview"] })}
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="font-serif text-2xl text-foreground">{kpi.value}</p>
                {kpi.change !== 0 && (
                  <p className={`flex items-center gap-1 font-sans text-xs mt-1 ${kpi.change > 0 ? "text-accent" : "text-destructive"}`}>
                    {kpi.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(kpi.change)}% vs prior period
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
            Paid Revenue — Last 14 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: "DM Sans" }} stroke="hsl(30 8% 45%)" />
                <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} stroke="hsl(30 8% 45%)" tickFormatter={(v) => fc(v)} />
                <Tooltip
                  formatter={(value: number) => [fc(value), "Revenue"]}
                  contentStyle={{ fontFamily: "DM Sans", fontSize: 12, borderRadius: 8, border: "1px solid hsl(30 15% 88%)" }}
                />
                <Bar dataKey="revenue" fill="hsl(38 60% 52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Guest</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Room</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Dates</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">No bookings yet</td>
                  </tr>
                ) : (
                  recentBookings.map((b) => {
                    const pd = getPaymentDisplay(b);
                    return (
                      <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{b.reference_code}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{b.guests?.full_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{b.guests?.email ?? ""}</p>
                        </td>
                        <td className="px-4 py-3 text-foreground">{b.rooms?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateGB(b.check_in)} → {formatDateGB(b.check_out)}</td>
                        <td className="px-4 py-3 font-medium text-foreground">GH₵ {Number(b.final_total_ghs).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[pd.effectiveStatus] ?? ""}`}>{formatBookingLabel(pd.effectiveStatus)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {pd.isDash ? (
                            <span className="text-muted-foreground font-medium text-center block">--</span>
                          ) : (
                            <Badge variant="secondary" className={`text-xs capitalize ${PAYMENT_COLORS[pd.label] ?? ""}`}>{formatBookingLabel(pd.label)}</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}