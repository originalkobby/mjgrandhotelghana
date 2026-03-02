import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  BedDouble,
  TrendingUp,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

export default function Overview() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [chartData, setChartData] = useState<{ day: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const prevMonthStart = format(startOfMonth(subDays(startOfMonth(now), 1)), "yyyy-MM-dd");
      const prevMonthEnd = format(endOfMonth(subDays(startOfMonth(now), 1)), "yyyy-MM-dd");

      // Current month bookings
      const { data: currentBookings } = await supabase
        .from("bookings")
        .select("final_total_ghs, status, check_in, check_out, created_at")
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd + "T23:59:59");

      // Previous month bookings for comparison
      const { data: prevBookings } = await supabase
        .from("bookings")
        .select("final_total_ghs, status")
        .gte("created_at", prevMonthStart)
        .lte("created_at", prevMonthEnd + "T23:59:59");

      const curr = currentBookings ?? [];
      const prev = prevBookings ?? [];

      const totalRevenue = curr
        .filter((b) => b.status !== "cancelled")
        .reduce((s, b) => s + Number(b.final_total_ghs), 0);
      const prevRevenue = prev
        .filter((b) => b.status !== "cancelled")
        .reduce((s, b) => s + Number(b.final_total_ghs), 0);

      const totalBookings = curr.length;
      const prevTotalBookings = prev.length;

      const confirmed = curr.filter((b) => b.status === "confirmed" || b.status === "completed").length;
      const adr = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const prevAdr = prevTotalBookings > 0 ? prevRevenue / prevTotalBookings : 0;

      const pctChange = (c: number, p: number) => (p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100));

      setKpis([
        {
          label: "Total Revenue",
          value: `GH₵ ${totalRevenue.toLocaleString()}`,
          change: pctChange(totalRevenue, prevRevenue),
          icon: DollarSign,
        },
        {
          label: "Bookings",
          value: totalBookings.toString(),
          change: pctChange(totalBookings, prevTotalBookings),
          icon: CalendarCheck,
        },
        {
          label: "Confirmed",
          value: confirmed.toString(),
          change: 0,
          icon: BedDouble,
        },
        {
          label: "Avg. Daily Rate",
          value: `GH₵ ${Math.round(adr).toLocaleString()}`,
          change: pctChange(adr, prevAdr),
          icon: TrendingUp,
        },
      ]);

      // Revenue chart — last 14 days
      const days: { day: string; revenue: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(now, i), "yyyy-MM-dd");
        const dayLabel = format(subDays(now, i), "MMM d");
        const dayRevenue = curr
          .filter((b) => b.created_at.startsWith(d) && b.status !== "cancelled")
          .reduce((s, b) => s + Number(b.final_total_ghs), 0);
        days.push({ day: dayLabel, revenue: dayRevenue });
      }
      setChartData(days);

      // Recent bookings
      const { data: recent } = await supabase
        .from("bookings")
        .select("id, reference_code, status, payment_status, check_in, check_out, final_total_ghs, created_at, rooms(name), guests(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(8);

      setRecentBookings((recent as unknown as Booking[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
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
      <div>
        <h1 className="font-serif text-2xl md:text-3xl text-foreground">Dashboard</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          {format(new Date(), "MMMM yyyy")} performance overview
        </p>
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
                    {Math.abs(kpi.change)}% vs last month
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
            Revenue — Last 14 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fontFamily: "DM Sans" }}
                  stroke="hsl(30 8% 45%)"
                />
                <YAxis
                  tick={{ fontSize: 11, fontFamily: "DM Sans" }}
                  stroke="hsl(30 8% 45%)"
                  tickFormatter={(v) => `₵${v}`}
                />
                <Tooltip
                  formatter={(value: number) => [`GH₵ ${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{
                    fontFamily: "DM Sans",
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid hsl(30 15% 88%)",
                  }}
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
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bookings yet
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{b.reference_code}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{b.guests?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{b.guests?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{b.rooms?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {b.check_in} → {b.check_out}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        GH₵ {Number(b.final_total_ghs).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[b.status] ?? ""}`}>
                          {b.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs capitalize ${PAYMENT_COLORS[b.payment_status] ?? ""}`}>
                          {b.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
