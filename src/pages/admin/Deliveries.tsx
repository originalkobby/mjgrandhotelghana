import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Bike, Loader2, MapPin, RefreshCw, ShieldAlert } from "lucide-react";
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_TONE,
  DeliveryStatus,
  isClosed,
} from "@/lib/deliveryStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import RidersPanel from "@/components/admin/RidersPanel";
import DeliverySettingsPanel from "@/components/admin/DeliverySettingsPanel";
import RiderPayoutsPanel from "@/components/admin/RiderPayoutsPanel";
import CashReconciliationPanel from "@/components/admin/CashReconciliationPanel";
import DeliveryReportsPanel from "@/components/admin/DeliveryReportsPanel";

type Rider = { id: string; full_name: string; status: string; is_active: boolean };

type Row = {
  id: string;
  status: DeliveryStatus;
  dest_address: string;
  dest_landmark: string | null;
  distance_km: number;
  fee_ghs: number;
  eta_min_minutes: number;
  eta_max_minutes: number;
  requires_review: boolean;
  rider_id: string | null;
  dispatch_state: string | null;
  dispatch_attempts: number | null;
  created_at: string;
  food_orders: {
    reference_code: string;
    guest_name: string;
    phone: string | null;
    total_ghs: number;
    payment_method: string | null;
    payment_status: string;
  } | null;
};

const STAFF_NEXT: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["cancelled"],
  rider_assigned: ["cancelled"],
};

function DeliveryBoard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("active");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const [{ data: d }, { data: r }] = await Promise.all([
      supabase
        .from("deliveries")
        .select(
          "id, status, dest_address, dest_landmark, distance_km, fee_ghs, eta_min_minutes, eta_max_minutes, requires_review, rider_id, dispatch_state, dispatch_attempts, created_at, food_orders(reference_code, guest_name, phone, total_ghs, payment_method, payment_status)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("delivery_riders")
        .select("id, full_name, status, is_active")
        .eq("is_active", true)
        .order("full_name"),
    ]);
    setRows((d as unknown as Row[]) ?? []);
    setRiders((r as Rider[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates so the board reflects rider progress without manual refreshes.
  useEffect(() => {
    const channel = supabase
      .channel("deliveries-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function act(deliveryId: string, body: Record<string, unknown>, okMsg: string) {
    setBusyId(deliveryId);
    const { data, error } = await supabase.functions.invoke("delivery-action", {
      body: { delivery_id: deliveryId, ...body },
    });
    setBusyId(null);
    if (error || (data as any)?.error) {
      toast({
        title: "Action failed",
        description: (data as any)?.error ?? error?.message ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: okMsg });
    load();
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "active" && isClosed(r.status)) return false;
      if (filter === "review" && !r.requires_review) return false;
      if (filter === "closed" && !isClosed(r.status)) return false;
      if (!q) return true;
      return (
        r.food_orders?.reference_code?.toLowerCase().includes(q) ||
        r.food_orders?.guest_name?.toLowerCase().includes(q) ||
        r.dest_address?.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-end gap-4">
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, guest or address"
            className="w-64"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">In progress</SelectItem>
              <SelectItem value="review">Needs review</SelectItem>
              <SelectItem value="closed">Completed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No deliveries to show here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((row) => {
            const busy = busyId === row.id;
            const nexts = STAFF_NEXT[row.status] ?? [];
            return (
              <Card key={row.id} className="overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-lg text-foreground">
                        {row.food_orders?.reference_code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {row.food_orders?.guest_name}
                        {row.food_orders?.phone ? ` · ${row.food_orders.phone}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className={DELIVERY_STATUS_TONE[row.status]}>
                      {DELIVERY_STATUS_LABELS[row.status]}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        {row.dest_address}
                        {row.dest_landmark ? ` (${row.dest_landmark})` : ""}
                      </span>
                    </p>
                    <p>
                      {row.distance_km} km · ETA {row.eta_min_minutes}–{row.eta_max_minutes} min ·
                      Fee GH₵ {Number(row.fee_ghs).toFixed(2)}
                    </p>
                    <p>
                      Order total GH₵ {Number(row.food_orders?.total_ghs ?? 0).toFixed(2)} ·{" "}
                      {row.food_orders?.payment_method === "cash_on_delivery"
                        ? "Cash on delivery"
                        : "Prepaid"}{" "}
                      · {row.food_orders?.payment_status}
                    </p>
                  </div>

                  {row.requires_review && row.status === "pending_review" && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
                      <p className="text-sm text-amber-900 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Long trip — approve or decline before
                        dispatch.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => act(row.id, { action: "review", decision: "approved" }, "Delivery approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => act(row.id, { action: "review", decision: "rejected" }, "Delivery declined")}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isClosed(row.status) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={row.rider_id ?? ""}
                        onValueChange={(v) =>
                          act(row.id, { action: "assign_rider", rider_id: v }, "Rider assigned")
                        }
                      >
                        <SelectTrigger className="w-52">
                          <SelectValue placeholder="Assign a rider" />
                        </SelectTrigger>
                        <SelectContent>
                          {riders.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.full_name} — {r.status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {nexts.map((n) => (
                        <Button
                          key={n}
                          size="sm"
                          variant={n === "cancelled" ? "outline" : "default"}
                          disabled={busy}
                          onClick={() =>
                            act(
                              row.id,
                              { action: "update_status", status: n },
                              `Marked ${DELIVERY_STATUS_LABELS[n]}`,
                            )
                          }
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : DELIVERY_STATUS_LABELS[n]}
                        </Button>
                      ))}
                      {row.rider_id && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" />
                          {riders.find((r) => r.id === row.rider_id)?.full_name ?? "Rider assigned"}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Deliveries() {
  const { role } = useAdminAuth();
  const canManage = role === "admin" || role === "operations_manager";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Dispatch riders, manage the delivery team, tune pricing and review performance.
        </p>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="riders">Riders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          {canManage && <TabsTrigger value="payouts">Payouts</TabsTrigger>}
          {canManage && <TabsTrigger value="cash">Cash &amp; reconciliation</TabsTrigger>}
          {canManage && <TabsTrigger value="reports">Reports</TabsTrigger>}
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <DeliveryBoard />
        </TabsContent>
        <TabsContent value="riders" className="mt-6">
          <RidersPanel canManage={canManage} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <DeliverySettingsPanel canEdit={canManage} />
        </TabsContent>
        {canManage && (
          <TabsContent value="payouts" className="mt-6">
            <RiderPayoutsPanel />
          </TabsContent>
        )}
        {canManage && (
          <TabsContent value="cash" className="mt-6">
            <CashReconciliationPanel />
          </TabsContent>
        )}
        {canManage && (
          <TabsContent value="reports" className="mt-6">
            <DeliveryReportsPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
