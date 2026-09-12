import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { DELIVERY_STATUS_LABELS, DeliveryStatus } from "@/lib/deliveryStatus";

type Row = {
  id: string;
  status: DeliveryStatus;
  fee_ghs: number;
  distance_km: number;
  created_at: string;
  delivered_at: string | null;
  rider_id: string | null;
};

type Audit = {
  id: string;
  action: string;
  entity_type: string;
  actor_role: string | null;
  created_at: string;
  details: any;
};

function minutesBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

export default function DeliveryReportsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [riders, setRiders] = useState<Record<string, string>>({});
  const [audit, setAudit] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: d }, { data: r }, { data: a }] = await Promise.all([
        supabase
          .from("deliveries")
          .select("id, status, fee_ghs, distance_km, created_at, delivered_at, rider_id")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("delivery_riders").select("id, full_name"),
        supabase
          .from("delivery_audit_log")
          .select("id, action, entity_type, actor_role, created_at, details")
          .order("created_at", { ascending: false })
          .limit(40),
      ]);
      setRows((d as Row[]) ?? []);
      setRiders(Object.fromEntries(((r as any[]) ?? []).map((x) => [x.id, x.full_name])));
      setAudit((a as Audit[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const delivered = rows.filter((r) => r.status === "delivered" && r.delivered_at);
    const times = delivered.map((r) => minutesBetween(r.created_at, r.delivered_at!));
    const avg = times.length ? times.reduce((s, t) => s + t, 0) / times.length : 0;
    const fees = rows
      .filter((r) => r.status === "delivered")
      .reduce((s, r) => s + Number(r.fee_ghs || 0), 0);
    const cancelled = rows.filter((r) => r.status === "cancelled" || r.status === "failed").length;

    const perRider = new Map<string, { count: number; fees: number }>();
    delivered.forEach((r) => {
      if (!r.rider_id) return;
      const cur = perRider.get(r.rider_id) ?? { count: 0, fees: 0 };
      cur.count += 1;
      cur.fees += Number(r.fee_ghs || 0);
      perRider.set(r.rider_id, cur);
    });

    return {
      total: rows.length,
      delivered: delivered.length,
      cancelled,
      avgMinutes: Math.round(avg),
      fees,
      perRider: [...perRider.entries()].sort((a, b) => b[1].count - a[1].count),
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tiles = [
    { label: "Deliveries", value: stats.total },
    { label: "Completed", value: stats.delivered },
    { label: "Cancelled or failed", value: stats.cancelled },
    { label: "Average door time", value: `${stats.avgMinutes} min` },
    { label: "Delivery fees earned", value: `GH₵ ${stats.fees.toFixed(2)}` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.label}</p>
              <p className="font-serif text-2xl text-foreground mt-1">{t.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rider performance</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.perRider.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed deliveries yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.perRider.map(([id, v]) => (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{riders[id] ?? "Rider"}</span>
                  <span className="text-muted-foreground">
                    {v.count} delivered · GH₵ {v.fees.toFixed(2)} in fees
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {audit.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground">
                    {a.action.replace(/_/g, " ")}
                    <span className="text-muted-foreground"> · {a.entity_type}</span>
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {a.actor_role && <Badge variant="outline">{a.actor_role}</Badge>}
                    {new Date(a.created_at).toLocaleString("en-GB")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Status names shown elsewhere: {Object.values(DELIVERY_STATUS_LABELS).slice(0, 4).join(", ")}…
      </p>
    </div>
  );
}
