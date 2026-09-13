import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const money = (n: number) =>
  `GH₵ ${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const todayISO = () => new Date().toISOString().slice(0, 10);

type Remittance = {
  id: string;
  rider_id: string | null;
  amount_due_ghs: number;
  cash_collected_ghs: number;
  amount_remitted_ghs: number;
  outstanding_ghs: number;
  collected_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  food_orders: { reference_code: string } | null;
};

export default function CashReconciliationPanel() {
  const [day, setDay] = useState(todayISO());
  const [rows, setRows] = useState<Remittance[]>([]);
  const [riders, setRiders] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<Remittance | null>(null);
  const [amount, setAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const from = `${day}T00:00:00Z`;
    const to = `${day}T23:59:59Z`;
    const [{ data: rem }, { data: r }, { data: o }, { data: e }, { data: p }] = await Promise.all([
      supabase
        .from("cod_remittances")
        .select("*, food_orders(reference_code)")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("delivery_riders").select("id, full_name"),
      supabase
        .from("food_orders")
        .select("id, total_ghs, delivery_fee_ghs, payment_method, payment_status, created_at")
        .gte("created_at", from)
        .lte("created_at", to),
      supabase
        .from("rider_earnings")
        .select("earning_ghs, created_at")
        .gte("created_at", from)
        .lte("created_at", to),
      supabase
        .from("rider_payouts")
        .select("amount_ghs, processed_at")
        .gte("processed_at", from)
        .lte("processed_at", to),
    ]);
    setRows((rem as unknown as Remittance[]) ?? []);
    setRiders(Object.fromEntries(((r as any[]) ?? []).map((x) => [x.id, x.full_name])));
    setOrders((o as any[]) ?? []);
    setEarnings((e as any[]) ?? []);
    setPayouts((p as any[]) ?? []);
    setLoading(false);
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const sum = (arr: any[], k: string) => arr.reduce((s, x) => s + Number(x[k] || 0), 0);
    const cod = orders.filter((o) => o.payment_method === "cash_on_delivery");
    const paystack = orders.filter((o) => o.payment_method === "paystack" && o.payment_status === "paid");
    const codCollected = sum(cod, "total_ghs");
    const online = sum(paystack, "total_ghs");
    const fees = sum(orders, "delivery_fee_ghs");
    const accrued = sum(earnings, "earning_ghs");
    const paid = sum(payouts, "amount_ghs");
    return {
      codCollected,
      online,
      sales: codCollected + online,
      accrued,
      paid,
      outstanding: accrued - paid,
      fees,
      hotelRevenue: fees - accrued,
    };
  }, [orders, earnings, payouts]);

  const cashOutstanding = rows.reduce((s, r) => s + Number(r.outstanding_ghs || 0), 0);

  async function confirm() {
    if (!active) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("rider-payouts", {
      body: {
        action: "confirm_remittance",
        remittance_id: active.id,
        amount_remitted_ghs: Number(amount),
      },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Could not record",
        description: (data as any)?.error ?? error?.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Cash remittance recorded" });
    setActive(null);
    setAmount("");
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    ["Cash on delivery", money(totals.codCollected)],
    ["Paystack", money(totals.online)],
    ["Total customer sales", money(totals.sales)],
    ["Rider earnings accrued", money(totals.accrued)],
    ["Rider payouts", money(totals.paid)],
    ["Outstanding rider balance", money(totals.outstanding)],
    ["Hotel delivery revenue", money(totals.hotelRevenue)],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Reconciliation date</Label>
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-48" />
        </div>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Daily delivery P&L
          </p>
          <p className="text-sm md:text-base font-medium text-foreground flex flex-wrap gap-x-3 gap-y-1">
            <span>Sales {money(totals.sales)}</span>
            <span className="text-muted-foreground">·</span>
            <span>Delivery fees {money(totals.fees)}</span>
            <span className="text-muted-foreground">·</span>
            <span>Rider cost {money(totals.accrued)}</span>
            <span className="text-muted-foreground">·</span>
            <span>Net delivery margin {money(totals.hotelRevenue)}</span>
            <span className="text-muted-foreground">·</span>
            <span>Owed to riders {money(totals.outstanding)}</span>
          </p>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="font-serif text-xl text-foreground mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Cash held by riders · {money(cashOutstanding)} outstanding
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Cash the rider collected from customers belongs to the hotel until it is handed over.
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-y-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/70 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-2">Order</th>
                  <th className="p-2">Rider</th>
                  <th className="p-2">Due</th>
                  <th className="p-2">Collected</th>
                  <th className="p-2">Remitted</th>
                  <th className="p-2">Outstanding</th>
                  <th className="p-2">Status</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="p-2">{r.food_orders?.reference_code ?? "—"}</td>
                    <td className="p-2">{r.rider_id ? riders[r.rider_id] ?? "—" : "—"}</td>
                    <td className="p-2 text-muted-foreground">{money(r.amount_due_ghs)}</td>
                    <td className="p-2">{money(r.cash_collected_ghs)}</td>
                    <td className="p-2">{money(r.amount_remitted_ghs)}</td>
                    <td className="p-2 font-medium">{money(r.outstanding_ghs)}</td>
                    <td className="p-2">
                      <Badge
                        variant="outline"
                        className={
                          Number(r.outstanding_ghs) <= 0
                            ? "border-emerald-500/40 text-emerald-600"
                            : "border-amber-500/40 text-amber-600"
                        }
                      >
                        {Number(r.outstanding_ghs) <= 0 ? "Settled" : "Cash held"}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">
                      {Number(r.outstanding_ghs) > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActive(r);
                            setAmount(String(r.outstanding_ghs));
                          }}
                        >
                          Record handover
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      No cash-on-delivery runs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record cash handover</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Order {active?.food_orders?.reference_code} · outstanding{" "}
              {money(Number(active?.outstanding_ghs ?? 0))}
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount handed over (GH₵)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button disabled={busy || !Number(amount)} onClick={confirm}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
