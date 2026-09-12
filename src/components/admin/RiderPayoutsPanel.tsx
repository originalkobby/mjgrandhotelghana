import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, ReceiptText } from "lucide-react";

type Earning = {
  id: string;
  rider_id: string;
  distance_km: number;
  customer_fee_ghs: number;
  base_earning_ghs: number;
  adjustment_total_ghs: number;
  earning_ghs: number;
  status: string;
  created_at: string;
  delivered_at: string | null;
  food_orders: { reference_code: string } | null;
};

type Payout = {
  id: string;
  rider_id: string;
  amount_ghs: number;
  delivery_count: number;
  method: string;
  reference: string | null;
  notes: string | null;
  period_start: string | null;
  period_end: string | null;
  processed_at: string;
};

const money = (n: number) =>
  `GH₵ ${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_TONE: Record<string, string> = {
  pending: "border-amber-500/40 text-amber-600",
  approved: "border-sky-500/40 text-sky-600",
  payable: "border-violet-500/40 text-violet-600",
  paid: "border-emerald-500/40 text-emerald-600",
  disputed: "border-red-500/40 text-red-600",
  adjusted: "border-orange-500/40 text-orange-600",
};

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "bank_transfer", label: "Bank transfer" },
];

export default function RiderPayoutsPanel() {
  const [riders, setRiders] = useState<{ id: string; full_name: string; rider_code: string }[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [riderFilter, setRiderFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [payDialog, setPayDialog] = useState(false);
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [adjusting, setAdjusting] = useState<Earning | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");

  const [statement, setStatement] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: e }, { data: p }] = await Promise.all([
      supabase.from("delivery_riders").select("id, full_name, rider_code").order("full_name"),
      supabase
        .from("rider_earnings")
        .select(
          "id, rider_id, distance_km, customer_fee_ghs, base_earning_ghs, adjustment_total_ghs, earning_ghs, status, created_at, delivered_at, food_orders(reference_code)",
        )
        .order("created_at", { ascending: false })
        .limit(400),
      supabase
        .from("rider_payouts")
        .select("*")
        .order("processed_at", { ascending: false })
        .limit(100),
    ]);
    setRiders((r as any[]) ?? []);
    setEarnings((e as unknown as Earning[]) ?? []);
    setPayouts((p as Payout[]) ?? []);
    setSelected({});
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const riderName = (id: string) =>
    riders.find((r) => r.id === id)?.full_name ?? "Unknown rider";

  const visible = useMemo(
    () => earnings.filter((e) => riderFilter === "all" || e.rider_id === riderFilter),
    [earnings, riderFilter],
  );

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const selectedRows = visible.filter((e) => selected[e.id]);
  const selectedRider = selectedRows.length ? selectedRows[0].rider_id : null;
  const sameRider = selectedRows.every((e) => e.rider_id === selectedRider);
  const selectedTotal = selectedRows.reduce((s, e) => s + Number(e.earning_ghs), 0);

  const outstandingByRider = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    earnings
      .filter((e) => e.status !== "paid")
      .forEach((e) => {
        const cur = map.get(e.rider_id) ?? { count: 0, total: 0 };
        cur.count += 1;
        cur.total += Number(e.earning_ghs);
        map.set(e.rider_id, cur);
      });
    return map;
  }, [earnings]);

  async function call(body: Record<string, unknown>, successMsg: string) {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("rider-payouts", { body });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Could not complete",
        description: (data as any)?.error ?? error?.message ?? "Please try again.",
        variant: "destructive",
      });
      return false;
    }
    toast({ title: successMsg });
    await load();
    return true;
  }

  async function showStatement(riderId: string) {
    const { data } = await supabase.functions.invoke("rider-payouts", {
      body: { action: "statement", rider_id: riderId },
    });
    if ((data as any)?.statement) {
      setStatement({ rider: riderName(riderId), ...(data as any).statement });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Outstanding per rider */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {riders.map((r) => {
          const o = outstandingByRider.get(r.id) ?? { count: 0, total: 0 };
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-1">
                <p className="text-sm text-foreground">{r.full_name}</p>
                <p className="font-serif text-xl text-foreground">{money(o.total)}</p>
                <p className="text-xs text-muted-foreground">{o.count} unpaid deliveries</p>
                <Button
                  variant="link"
                  className="px-0 h-auto text-xs"
                  onClick={() => showStatement(r.id)}
                >
                  <ReceiptText className="w-3 h-3 mr-1" /> Statement
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {riders.length === 0 && (
          <p className="text-sm text-muted-foreground">No riders yet.</p>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Rider earnings</CardTitle>
          <div className="w-56">
            <Select value={riderFilter} onValueChange={setRiderFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All riders</SelectItem>
                {riders.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
              <span className="text-sm">
                {selectedIds.length} selected · {money(selectedTotal)}
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => call({ action: "set_status", earning_ids: selectedIds, status: "approved" }, "Earnings approved")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => call({ action: "set_status", earning_ids: selectedIds, status: "payable" }, "Marked payable")}
              >
                Mark payable
              </Button>
              <Button size="sm" disabled={busy || !sameRider} onClick={() => setPayDialog(true)}>
                Record payout
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected({})}>
                Clear
              </Button>
            </div>
          )}
          {!sameRider && selectedIds.length > 0 && (
            <p className="text-xs text-destructive">
              A payout can only cover one rider at a time.
            </p>
          )}

          <div className="max-h-[460px] overflow-y-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/70 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-2 w-8" />
                  <th className="p-2">Order</th>
                  <th className="p-2">Rider</th>
                  <th className="p-2">Distance</th>
                  <th className="p-2">Guest fee</th>
                  <th className="p-2">Rider earning</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Date</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((e, i) => (
                  <tr key={e.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="p-2">
                      <Checkbox
                        checked={!!selected[e.id]}
                        disabled={e.status === "paid"}
                        onCheckedChange={(v) => setSelected({ ...selected, [e.id]: !!v })}
                      />
                    </td>
                    <td className="p-2">{e.food_orders?.reference_code ?? "—"}</td>
                    <td className="p-2">{riderName(e.rider_id)}</td>
                    <td className="p-2">{Number(e.distance_km).toFixed(1)} km</td>
                    <td className="p-2 text-muted-foreground">{money(e.customer_fee_ghs)}</td>
                    <td className="p-2 font-medium">{money(e.earning_ghs)}</td>
                    <td className="p-2">
                      <Badge variant="outline" className={STATUS_TONE[e.status] ?? ""}>
                        {e.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {new Date(e.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-2 text-right">
                      {e.status !== "paid" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAdjusting(e);
                            setDelta("");
                            setReason("");
                          }}
                        >
                          Adjust
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-muted-foreground">
                      No rider earnings recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[320px] overflow-y-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/70 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-2">Rider</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Deliveries</th>
                  <th className="p-2">Period</th>
                  <th className="p-2">Method</th>
                  <th className="p-2">Reference</th>
                  <th className="p-2">Processed</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, i) => (
                  <tr key={p.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="p-2">{riderName(p.rider_id)}</td>
                    <td className="p-2 font-medium">{money(p.amount_ghs)}</td>
                    <td className="p-2">{p.delivery_count}</td>
                    <td className="p-2 text-muted-foreground">
                      {p.period_start
                        ? `${new Date(p.period_start).toLocaleDateString("en-GB")} – ${new Date(
                            p.period_end ?? p.period_start,
                          ).toLocaleDateString("en-GB")}`
                        : "—"}
                    </td>
                    <td className="p-2">{p.method.replace("_", " ")}</td>
                    <td className="p-2 text-muted-foreground">{p.reference ?? "—"}</td>
                    <td className="p-2 text-muted-foreground">
                      {new Date(p.processed_at).toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No payouts recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record payout */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedRider ? riderName(selectedRider) : ""} · {selectedIds.length} deliveries ·{" "}
              <span className="text-foreground font-medium">{money(selectedTotal)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              This records a payment you have already made. No money is sent by the system.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reference</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                const ok = await call(
                  {
                    action: "record_payout",
                    rider_id: selectedRider,
                    earning_ids: selectedIds,
                    method,
                    reference,
                    notes,
                  },
                  "Payout recorded",
                );
                if (ok) {
                  setPayDialog(false);
                  setReference("");
                  setNotes("");
                }
              }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust an earning */}
      <Dialog open={!!adjusting} onOpenChange={(o) => !o && setAdjusting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust earning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Current: {adjusting ? money(adjusting.earning_ghs) : ""}
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Adjustment (GH₵ — use a minus sign to deduct)</Label>
              <Input
                type="number"
                step="0.01"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason (required)</Label>
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjusting(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !reason.trim() || !Number(delta)}
              onClick={async () => {
                const ok = await call(
                  {
                    action: "adjust",
                    earning_id: adjusting?.id,
                    delta_ghs: Number(delta),
                    reason,
                  },
                  "Adjustment recorded",
                );
                if (ok) setAdjusting(null);
              }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statement */}
      <Dialog open={!!statement} onOpenChange={(o) => !o && setStatement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rider statement — {statement?.rider}</DialogTitle>
          </DialogHeader>
          {statement && (
            <div className="space-y-2 text-sm">
              {[
                ["Opening balance", money(statement.opening_balance_ghs)],
                ["Completed deliveries", String(statement.completed_deliveries)],
                ["Gross rider earnings", money(statement.gross_earnings_ghs)],
                ["Adjustments", money(statement.adjustments_ghs)],
                ["Previous payouts", `-${money(statement.previous_payouts_ghs)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/60 py-1">
                  <span className="text-muted-foreground">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-medium">
                <span>Current payable</span>
                <span>{money(statement.current_payable_ghs)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
