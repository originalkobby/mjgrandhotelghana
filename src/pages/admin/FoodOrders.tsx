import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, RefreshCw, Eye, UtensilsCrossed } from "lucide-react";
import { formatDateGB } from "@/lib/dateUtils";

type FoodOrderItem = {
  id: string;
  food_order_id: string;
  name: string;
  price_ghs: number;
  quantity: number;
  line_total_ghs: number;
};

type FoodOrder = {
  id: string;
  guest_name: string;
  email: string | null;
  phone: string | null;
  room_number: string | null;
  order_type: "dine_in" | "room_service" | "takeaway" | "delivery";
  status: "pending" | "confirmed" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  notes: string | null;
  total_ghs: number;
  reference_code: string;
  created_at: string;
  updated_at: string;
  delivery_address: string | null;
  delivery_landmark: string | null;
  delivery_fee_ghs: number | null;
  delivery_zones: { name: string } | null;
  food_order_items: FoodOrderItem[];
};

const STATUS_SEQUENCE: FoodOrder["status"][] = ["pending", "confirmed", "ready", "completed"];
const DELIVERY_STATUS_SEQUENCE: FoodOrder["status"][] = [
  "pending",
  "confirmed",
  "ready",
  "out_for_delivery",
  "completed",
];

const STATUS_LABELS: Record<FoodOrder["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<FoodOrder["status"], string> = {
  pending: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ready: "bg-green-500/15 text-green-400 border-green-500/30",
  out_for_delivery: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-emerald-900/30 text-emerald-300 border-emerald-900/40",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const TYPE_LABELS: Record<FoodOrder["order_type"], string> = {
  dine_in: "Dine-in",
  room_service: "Room Service",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

async function fetchFoodOrders(): Promise<FoodOrder[]> {
  const { data, error } = await supabase
    .from("food_orders")
    .select("*, delivery_zones(name), food_order_items(*)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data as unknown as FoodOrder[]) ?? [];
}


export default function AdminFoodOrders() {
  const { role } = useAdminAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<FoodOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-food-orders"],
    queryFn: fetchFoodOrders,
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("food-orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "food_orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-food-orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "food_order_items" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-food-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      const matchesType = typeFilter === "all" || o.order_type === typeFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.guest_name.toLowerCase().includes(q) ||
        o.reference_code.toLowerCase().includes(q) ||
        (o.room_number && o.room_number.toLowerCase().includes(q));
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [orders, statusFilter, typeFilter, search]);

  async function updateStatus(id: string, newStatus: FoodOrder["status"]) {
    setUpdatingId(id);
    const { error } = await supabase.from("food_orders").update({ status: newStatus }).eq("id", id);
    setUpdatingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-food-orders"] });
    toast.success(`Order marked ${STATUS_LABELS[newStatus].toLowerCase()}`);
  }

  function nextStatus(order: Pick<FoodOrder, "status" | "order_type">): FoodOrder["status"] | null {
    if (order.status === "cancelled") return null;
    const seq = order.order_type === "delivery" ? DELIVERY_STATUS_SEQUENCE : STATUS_SEQUENCE;
    const idx = seq.indexOf(order.status);
    if (idx === -1 || idx === seq.length - 1) return null;
    return seq[idx + 1];
  }


  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-serif text-foreground">Food Orders</h1>
            <p className="text-sm text-muted-foreground">Live restaurant orders and fulfilment</p>
          </div>
          <Badge variant="secondary">{orders?.length || 0} orders</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, reference, room"
              className="pl-9 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_SEQUENCE.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="dine_in">Dine-in</SelectItem>
              <SelectItem value="room_service">Room Service</SelectItem>
              <SelectItem value="takeaway">Takeaway</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-food-orders"] })}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="flex flex-col flex-1 min-h-0">
        <CardContent className="flex flex-col flex-1 min-h-0 p-0">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm font-sans">
              <thead className="sticky top-0 z-20 bg-[hsl(var(--admin-surface))]">
                <tr className="border-b border-border">
                  {[
                    { label: "Reference", cls: "w-[14%]" },
                    { label: "Status", cls: "w-[12%]" },
                    { label: "Customer", cls: "w-[16%]" },
                    { label: "Type", cls: "w-[12%]" },
                    { label: "Items", cls: "w-[26%]" },
                    { label: "Total", cls: "w-[10%]" },
                    { label: "Time", cls: "w-[10%]" },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className={`${h.cls} px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider`}
                    >
                      {h.label}
                    </th>
                  ))}
                  <th className="w-[8%] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-muted-foreground">
                      <UtensilsCrossed className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      No food orders found
                    </td>
                  </tr>
                ) : (
                  filtered.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={`border-b border-border/50 transition-colors ${
                        idx % 2 === 0 ? "bg-muted/40" : ""
                      } hover:bg-muted/60`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {order.reference_code}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`${STATUS_COLORS[order.status]} capitalize text-[10px]`}
                        >
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{order.guest_name}</p>
                        {order.room_number && (
                          <p className="text-[10px] text-muted-foreground">Room {order.room_number}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {TYPE_LABELS[order.order_type]}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground truncate max-w-xs">
                          {order.food_order_items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                        GH₵ {Number(order.total_ghs).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDateGB(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelected(order)}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {nextStatus(order.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updatingId === order.id}
                              onClick={() => updateStatus(order.id, nextStatus(order.status)!)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {STATUS_LABELS[nextStatus(order.status)!]}
                            </Button>
                          )}
                          {order.status !== "cancelled" && order.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updatingId === order.id}
                              onClick={() => updateStatus(order.id, "cancelled")}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Order {selected?.reference_code}</DialogTitle>
            <DialogDescription>
              {selected && `${TYPE_LABELS[selected.order_type]} • ${formatDateGB(selected.created_at)}`}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Customer</p>
                  <p className="font-medium">{selected.guest_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contact</p>
                  <p>{selected.phone || "—"}</p>
                  <p className="text-xs text-muted-foreground">{selected.email || "—"}</p>
                </div>
                {selected.room_number && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Room</p>
                    <p className="font-medium">{selected.room_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={`${STATUS_COLORS[selected.status]} text-[10px]`}
                  >
                    {STATUS_LABELS[selected.status]}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                {selected.food_order_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span className="tabular-nums">GH₵ {Number(item.line_total_ghs).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border/60 pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span className="tabular-nums text-gold">GH₵ {Number(selected.total_ghs).toFixed(2)}</span>
                </div>
              </div>

              {selected.notes && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-foreground">{selected.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {selected.status !== "cancelled" && selected.status !== "completed" && nextStatus(selected.status) && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateStatus(selected.id, "cancelled");
                        setSelected(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        updateStatus(selected.id, nextStatus(selected.status)!);
                        setSelected(null);
                      }}
                    >
                      Mark {STATUS_LABELS[nextStatus(selected.status)!]}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
