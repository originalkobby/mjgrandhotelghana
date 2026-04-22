import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Zap,
  Lock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LogIn,
  LogOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  closure_reason: string | null;
}

interface DailyOperations {
  date: string;
  bookedRooms: number;
  expectedCheckIns: number;
  expectedCheckOuts: number;
}

async function fetchInventoryData(weekStart: Date, weekEnd: Date) {
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(weekEnd, "yyyy-MM-dd");

  const [{ data: roomsData }, { data: invData }, { data: checkInsData }, { data: checkOutsData }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, base_price_ghs")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("room_inventory")
      .select("id, room_id, date, total_count, booked_count, is_closed, rate_override, closure_reason")
      .gte("date", startStr)
      .lte("date", endStr),
    supabase
      .from("bookings")
      .select("id, check_in, status")
      .gte("check_in", startStr)
      .lte("check_in", endStr)
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("bookings")
      .select("id, check_out, status")
      .gte("check_out", startStr)
      .lte("check_out", endStr)
      .in("status", ["pending", "confirmed"]),
  ]);

  const rooms = roomsData ?? [];
  const map = new Map<string, InvCell>();
  const dailyStats = new Map<string, DailyOperations>();
  for (const day of eachDayOfInterval({ start: weekStart, end: weekEnd })) {
    const date = format(day, "yyyy-MM-dd");
    dailyStats.set(date, {
      date,
      bookedRooms: 0,
      expectedCheckIns: 0,
      expectedCheckOuts: 0,
    });
  }

  for (const row of invData ?? []) {
    map.set(`${row.room_id}|${row.date}`, row as InvCell);
    const dayStats = dailyStats.get(row.date);
    if (dayStats) dayStats.bookedRooms += Number(row.booked_count ?? 0);
  }
  for (const booking of checkInsData ?? []) {
    const dayStats = dailyStats.get(booking.check_in);
    if (dayStats) dayStats.expectedCheckIns += 1;
  }
  for (const booking of checkOutsData ?? []) {
    const dayStats = dailyStats.get(booking.check_out);
    if (dayStats) dayStats.expectedCheckOuts += 1;
  }

  return { rooms, inventory: map, dailyStats };
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
    closure_reason: "",
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

  // Realtime: refetch grid whenever a room_inventory row changes (booking created,
  // cancelled, completed, no-showed, or admin edit from any tab/session).
  useEffect(() => {
    const channel = supabase
      .channel("admin-inventory-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_inventory" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const rooms = data?.rooms ?? [];
  const inventory = data?.inventory ?? new Map<string, InvCell>();
  const dailyStats = data?.dailyStats ?? new Map<string, DailyOperations>();

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
        closure_reason: null,
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
      closure_reason: cell.closure_reason ?? "",
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
      closure_reason: editForm.is_closed && editForm.closure_reason.trim()
        ? editForm.closure_reason.trim()
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
    if (closed) return "bg-slate-700 text-white";
    const pct = total > 0 ? booked / total : 0;
    if (pct >= 1) return "bg-green-600 text-white";
    if (pct >= 0.7) return "bg-lime-500 text-white";
    if (pct >= 0.4) return "bg-amber-500 text-white";
    if (pct > 0) return "bg-orange-500 text-white";
    return "bg-red-600 text-white";
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Grid */}
        <Card className="min-w-0">
          <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-card z-10 w-[118px]">
                    Room
                  </th>
                  {days.map((d) => (
                    <th
                      key={d.toISOString()}
                       className={`text-center px-1 py-3 text-xs font-medium uppercase tracking-wider w-[86px] ${
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
                         <td className="px-3 py-3 sticky left-0 bg-card z-10">
                          <p className="font-medium text-foreground">{room.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Base: {fc(Number(room.base_price_ghs))}
                          </p>
                        </td>
                        {days.map((d) => {
                          const cell = getCell(room.id, d);
                          const avail = cell.total_count - cell.booked_count;
                          const pct = cell.total_count > 0 ? Math.round((cell.booked_count / cell.total_count) * 100) : 0;
                          const rate = cell.rate_override ?? Number(room.base_price_ghs);
                          return (
                             <td key={d.toISOString()} className="px-0.5 py-1">
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => openEdit(room, d)}
                                      className={`w-[82px] h-[92px] rounded-md p-1.5 text-xs transition-colors hover:ring-2 hover:ring-ring/50 cursor-pointer flex flex-col items-center justify-center ${occupancyColor(
                                        cell.booked_count,
                                        cell.total_count,
                                        cell.is_closed
                                      )}`}
                                    >
                                      {cell.is_closed ? (
                                        <div className="flex flex-col items-center justify-center gap-0.5">
                                          <div className="flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            <span>Closed</span>
                                          </div>
                                          {cell.closure_reason && (
                                            <span className="text-[10px] opacity-70 truncate max-w-full">
                                              {cell.closure_reason}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <>
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
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="font-sans text-xs">
                                    <div className="space-y-1">
                                      <p className="font-semibold">
                                        {room.name} · {format(d, "EEE, MMM d")}
                                      </p>
                                      {cell.is_closed ? (
                                        <>
                                          <p className="text-muted-foreground">
                                            Closed — no bookings accepted
                                          </p>
                                          {cell.closure_reason && (
                                            <p>
                                              Reason: <span className="font-medium">{cell.closure_reason}</span>
                                            </p>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <p>
                                            Occupancy: <span className="font-medium">{pct}%</span> ({cell.booked_count}/{cell.total_count} booked, {avail} left)
                                          </p>
                                          <p>
                                            Rate: <span className="font-medium">{fc(rate)}</span>
                                            {cell.rate_override && (
                                              <span className="text-muted-foreground"> (override)</span>
                                            )}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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

        <Card className="xl:sticky xl:top-24 xl:self-start">
          <CardContent className="p-4 space-y-4">
            <div>
              <h2 className="font-serif text-lg text-foreground">Weekly Operations</h2>
              <p className="font-sans text-xs text-muted-foreground">
                Booked rooms, arrivals, and departures by day
              </p>
            </div>
            <ScrollArea className="h-[min(58vh,32rem)] pr-3">
              <div className="space-y-3">
                {days.map((day) => {
                  const date = format(day, "yyyy-MM-dd");
                  const stats = dailyStats.get(date) ?? {
                    date,
                    bookedRooms: 0,
                    expectedCheckIns: 0,
                    expectedCheckOuts: 0,
                  };
                  const maxValue = Math.max(
                    1,
                    stats.bookedRooms,
                    stats.expectedCheckIns,
                    stats.expectedCheckOuts
                  );

                  return (
                    <div key={date} className="rounded-md border border-border bg-card p-3 font-sans">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {format(day, "EEE")}
                          </p>
                          <p className="text-sm font-medium text-foreground">{format(day, "MMM d")}</p>
                        </div>
                        <CalendarDays className="h-4 w-4 text-accent" />
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-[88px_1fr_24px] items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Booked</span>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${(stats.bookedRooms / maxValue) * 100}%` }}
                            />
                          </div>
                          <span className="text-right font-semibold text-foreground">{stats.bookedRooms}</span>
                        </div>
                        <div className="grid grid-cols-[88px_1fr_24px] items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <LogIn className="h-3 w-3" /> In
                          </span>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${(stats.expectedCheckIns / maxValue) * 100}%` }}
                            />
                          </div>
                          <span className="text-right font-semibold text-foreground">{stats.expectedCheckIns}</span>
                        </div>
                        <div className="grid grid-cols-[88px_1fr_24px] items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <LogOut className="h-3 w-3" /> Out
                          </span>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-secondary-foreground"
                              style={{ width: `${(stats.expectedCheckOuts / maxValue) * 100}%` }}
                            />
                          </div>
                          <span className="text-right font-semibold text-foreground">{stats.expectedCheckOuts}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-sans text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-600" /> Empty
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-500" /> Low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500" /> Half
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-lime-500" /> Near Full
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-600" /> Full
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-700" /> Closed
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
                  <p className="text-[10px] text-muted-foreground">
                    Leave blank to use the room type's base price ({fc(Number(selectedCell.room.base_price_ghs))}). Per-date overrides take precedence over the dynamic pricing engine.
                  </p>
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

              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Close Date</p>
                    <p className="text-xs text-muted-foreground">Block all bookings for this date</p>
                  </div>
                  <Switch
                    checked={editForm.is_closed}
                    onCheckedChange={(v) => setEditForm({ ...editForm, is_closed: v })}
                  />
                </div>
                {editForm.is_closed && (
                  <div className="space-y-2">
                    <Label className="text-xs">Closure Reason</Label>
                    <Input
                      value={editForm.closure_reason}
                      onChange={(e) => setEditForm({ ...editForm, closure_reason: e.target.value })}
                      placeholder="e.g. Maintenance, Private event, Deep cleaning"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Shown on hover and inside the closed cell. Optional.
                    </p>
                  </div>
                )}
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
