import { useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Zap,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

interface Room {
  id: string;
  name: string;
  base_price_ghs: number;
}

interface InvCell {
  id?: string;
  room_id: string;
  date: string;
  total_count: number;
  booked_count: number;
  is_closed: boolean;
  rate_override: number | null;
}

async function fetchInventoryData(weekStart: Date, weekEnd: Date) {
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(weekEnd, "yyyy-MM-dd");

  const [{ data: roomsData }, { data: invData }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, base_price_ghs")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("room_inventory")
      .select("id, room_id, date, total_count, booked_count, is_closed, rate_override")
      .gte("date", startStr)
      .lte("date", endStr),
  ]);

  const rooms = roomsData ?? [];
  const map = new Map<string, InvCell>();
  for (const row of invData ?? []) {
    map.set(`${row.room_id}|${row.date}`, row as InvCell);
  }

  return { rooms, inventory: map };
}

export default function Inventory() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [pricingRunning, setPricingRunning] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    room: Room;
    date: string;
    cell: InvCell;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    rate_override: "",
    total_count: "",
    is_closed: false,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { format: fc } = useCurrency();
  const queryClient = useQueryClient();

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekKey = format(weekStart, "yyyy-MM-dd");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin-inventory", weekKey],
    queryFn: () => fetchInventoryData(weekStart, weekEnd),
    staleTime: 30_000,
  });

  const rooms = data?.rooms ?? [];
  const inventory = data?.inventory ?? new Map<string, InvCell>();

  const getCell = (roomId: string, date: Date): InvCell => {
    const dateStr = format(date, "yyyy-MM-dd");
    return (
      inventory.get(`${roomId}|${dateStr}`) ?? {
        room_id: roomId,
        date: dateStr,
        total_count: 1,
        booked_count: 0,
        is_closed: false,
        rate_override: null,
      }
    );
  };

  const openEdit = (room: Room, date: Date) => {
    const cell = getCell(room.id, date);
    setSelectedCell({ room, date: format(date, "yyyy-MM-dd"), cell });
    setEditForm({
      rate_override: cell.rate_override?.toString() ?? "",
      total_count: cell.total_count.toString(),
      is_closed: cell.is_closed,
    });
  };

  const handleSave = async () => {
    if (!selectedCell) return;
    setSaving(true);

    const payload = {
      room_id: selectedCell.cell.room_id,
      date: selectedCell.date,
      total_count: parseInt(editForm.total_count) || 1,
      booked_count: selectedCell.cell.booked_count,
      is_closed: editForm.is_closed,
      rate_override: editForm.rate_override
        ? parseFloat(editForm.rate_override)
        : null,
    };

    let error;
    if (selectedCell.cell.id) {
      ({ error } = await supabase
        .from("room_inventory")
        .update(payload)
        .eq("id", selectedCell.cell.id));
    } else {
      ({ error } = await supabase.from("room_inventory").insert(payload));
    }

    setSaving(false);
    setSelectedCell(null);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${selectedCell.room.name} — ${selectedCell.date}` });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    }
  };

  const runDynamicPricing = async () => {
    setPricingRunning(true);
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
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      toast({
        title: "Dynamic Pricing Complete",
        description: `Updated ${d.updated} rate entries across ${d.rooms} rooms`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPricingRunning(false);
    }
  };

  const occupancyColor = (booked: number, total: number, closed: boolean) => {
    if (closed) return "bg-muted text-muted-foreground";
    const pct = total > 0 ? booked / total : 0;
    if (pct >= 0.9) return "bg-destructive/15 text-destructive";
    if (pct >= 0.7) return "bg-gold-light/20 text-gold-dark";
    if (pct >= 0.4) return "bg-accent/15 text-accent";
    return "bg-accent/5 text-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">
            Inventory Control
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Manage room availability, rates, and closures
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runDynamicPricing}
            disabled={pricingRunning}
            className="gap-2"
          >
            <Zap className={`w-4 h-4 ${pricingRunning ? "animate-spin" : ""}`} />
            {pricingRunning ? "Running…" : "Run Pricing Engine"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-inventory"] })}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <p className="font-sans text-sm font-medium text-foreground">
          {format(weekStart, "MMM d")} — {format(weekEnd, "MMM d, yyyy")}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-card z-10 min-w-[140px]">
                    Room
                  </th>
                  {days.map((d) => (
                    <th
                      key={d.toISOString()}
                      className={`text-center px-2 py-3 text-xs font-medium uppercase tracking-wider min-w-[100px] ${
                        isSameDay(d, new Date()) ? "text-accent bg-accent/5" : "text-muted-foreground"
                      }`}
                    >
                      <div>{format(d, "EEE")}</div>
                      <div className="text-foreground font-semibold">{format(d, "d")}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-4 py-4 sticky left-0 bg-card">
                          <div className="h-4 bg-muted rounded animate-pulse w-24" />
                        </td>
                        {days.map((d) => (
                          <td key={d.toISOString()} className="px-2 py-4">
                            <div className="h-12 bg-muted rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rooms.map((room) => (
                      <tr key={room.id} className="border-b border-border/50">
                        <td className="px-4 py-3 sticky left-0 bg-card z-10">
                          <p className="font-medium text-foreground">{room.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Base: {fc(Number(room.base_price_ghs))}
                          </p>
                        </td>
                        {days.map((d) => {
                          const cell = getCell(room.id, d);
                          const avail = cell.total_count - cell.booked_count;
                          return (
                            <td key={d.toISOString()} className="px-1 py-1">
                              <button
                                onClick={() => openEdit(room, d)}
                                className={`w-full rounded-md p-2 text-xs transition-colors hover:ring-2 hover:ring-ring/50 cursor-pointer ${occupancyColor(
                                  cell.booked_count,
                                  cell.total_count,
                                  cell.is_closed
                                )}`}
                              >
                                {cell.is_closed ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    <span>Closed</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-medium">
                                      {cell.rate_override
                                        ? fc(cell.rate_override)
                                        : fc(Number(room.base_price_ghs))}
                                    </div>
                                    <div className="text-[10px] mt-0.5 opacity-70">
                                      {cell.booked_count}/{cell.total_count} booked
                                    </div>
                                    {avail <= 2 && avail > 0 && (
                                      <div className="text-[10px] font-semibold mt-0.5">
                                        {avail} left
                                      </div>
                                    )}
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-sans text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-accent/5 border border-border" /> Low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-accent/15" /> Moderate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gold-light/20" /> High
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-destructive/15" /> Near Full
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-muted" /> Closed
        </span>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={(o) => !o && setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{selectedCell?.room.name}</DialogTitle>
            <DialogDescription className="font-sans">
              {selectedCell?.date
                ? format(new Date(selectedCell.date + "T00:00:00"), "EEEE, MMM d, yyyy")
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedCell && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Rate Override</Label>
                  <Input
                    type="number"
                    value={editForm.rate_override}
                    onChange={(e) => setEditForm({ ...editForm, rate_override: e.target.value })}
                    placeholder={`Base: ${Number(selectedCell.room.base_price_ghs)}`}
                  />
                  <p className="text-[10px] text-muted-foreground">Leave empty to use dynamic/base rate</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Total Rooms</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editForm.total_count}
                    onChange={(e) => setEditForm({ ...editForm, total_count: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Default comes from the room type's Total Rooms setting. Change here only for date-specific overrides (e.g. maintenance).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Close Date</p>
                  <p className="text-xs text-muted-foreground">Block all bookings for this date</p>
                </div>
                <Switch
                  checked={editForm.is_closed}
                  onCheckedChange={(v) => setEditForm({ ...editForm, is_closed: v })}
                />
              </div>

              <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
                Currently booked: {selectedCell.cell.booked_count} / {selectedCell.cell.total_count}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCell(null)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
