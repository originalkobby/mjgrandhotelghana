import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, BedDouble, DollarSign, Users } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

type Range = "7d" | "30d" | "90d";

export default function Reports() {
  const [range, setRange] = useState<Range>("30d");

  const daysBack = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const startDate = format(subDays(new Date(), daysBack), "yyyy-MM-dd");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["reports-bookings", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, final_total_ghs, base_total_ghs, status, payment_status, room_id, created_at, rooms(name)")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Revenue over time
  const revenueByDay = (() => {
    if (!bookings) return [];
    const map: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.payment_status === "paid") {
        const day = format(parseISO(b.created_at), "MMM dd");
        map[day] = (map[day] || 0) + b.final_total_ghs;
      }
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
  })();

  // Bookings by status
  const statusCounts = (() => {
    if (!bookings) return [];
    const map: Record<string, number> = {};
    bookings.forEach((b) => {
      map[b.status] = (map[b.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  // Revenue by room
  const revenueByRoom = (() => {
    if (!bookings) return [];
    const map: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.payment_status === "paid") {
        const name = (b.rooms as any)?.name || "Unknown";
        map[name] = (map[name] || 0) + b.final_total_ghs;
      }
    });
    return Object.entries(map)
      .map(([room, revenue]) => ({ room, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  })();

  const totalRevenue = bookings?.filter((b) => b.payment_status === "paid").reduce((s, b) => s + b.final_total_ghs, 0) || 0;
  const totalBookings = bookings?.length || 0;
  const paidBookings = bookings?.filter((b) => b.payment_status === "paid").length || 0;
  const avgBookingValue = paidBookings > 0 ? totalRevenue / paidBookings : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-foreground">Reports & Analytics</h1>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `GH₵ ${totalRevenue.toLocaleString()}`, icon: DollarSign },
          { label: "Total Bookings", value: totalBookings, icon: Users },
          { label: "Paid Bookings", value: paidBookings, icon: TrendingUp },
          { label: "Avg Booking Value", value: `GH₵ ${avgBookingValue.toFixed(0)}`, icon: BedDouble },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusCounts} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {statusCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue by Room Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByRoom}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="room" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
