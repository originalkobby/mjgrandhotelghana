import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const money = (n: number) =>
  `GH₵ ${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Earning = {
  id: string;
  earning_ghs: number;
  distance_km: number;
  status: string;
  created_at: string;
  food_orders: { reference_code: string } | null;
};

export default function RiderEarnings({ riderId }: { riderId: string }) {
  const [rows, setRows] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // RLS limits a rider to their own rows; hotel margin is never exposed.
      const { data } = await supabase
        .from("rider_earnings")
        .select("id, earning_ghs, distance_km, status, created_at, food_orders(reference_code)")
        .eq("rider_id", riderId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!cancelled) {
        setRows((data as unknown as Earning[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [riderId]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sum = (from: Date) =>
      rows
        .filter((r) => new Date(r.created_at) >= from)
        .reduce((s, r) => s + Number(r.earning_ghs), 0);

    const todayRows = rows.filter((r) => new Date(r.created_at) >= startOfDay);
    const pending = rows
      .filter((r) => r.status !== "paid")
      .reduce((s, r) => s + Number(r.earning_ghs), 0);
    const paid = rows
      .filter((r) => r.status === "paid")
      .reduce((s, r) => s + Number(r.earning_ghs), 0);
    const total = rows.reduce((s, r) => s + Number(r.earning_ghs), 0);

    return {
      today: sum(startOfDay),
      todayCount: todayRows.length,
      week: sum(startOfWeek),
      month: sum(startOfMonth),
      pending,
      paid,
      deliveries: rows.length,
      average: rows.length ? total / rows.length : 0,
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 text-gold animate-spin" />
      </div>
    );
  }

  const tiles: [string, string, string?][] = [
    ["Today", money(stats.today), `${stats.todayCount} deliveries`],
    ["This week", money(stats.week)],
    ["This month", money(stats.month)],
    ["Pending payout", money(stats.pending)],
    ["Total paid", money(stats.paid)],
    ["Average per delivery", money(stats.average), `${stats.deliveries} completed`],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(([label, value, hint]) => (
          <Card key={label} className="border-cream/10 bg-cream/[0.03]">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cream/40">{label}</p>
              <p className="font-serif text-xl text-gold mt-1">{value}</p>
              {hint && <p className="text-xs text-cream/45 mt-0.5">{hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-cream/35 mb-2">
          Earnings history
        </p>
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border border-cream/10 rounded-md px-3 py-2"
            >
              <div>
                <p className="text-sm text-cream/80">{r.food_orders?.reference_code ?? "—"}</p>
                <p className="text-xs text-cream/40">
                  {new Date(r.created_at).toLocaleDateString("en-GB")} ·{" "}
                  {Number(r.distance_km).toFixed(1)} km
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gold">{money(r.earning_ghs)}</p>
                <Badge variant="outline" className="border-cream/20 text-cream/60 text-[10px]">
                  {r.status}
                </Badge>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-center text-cream/45 py-8 text-sm">No earnings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
