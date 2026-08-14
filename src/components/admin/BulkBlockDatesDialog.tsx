import { useMemo, useState } from "react";
import { CalendarOff } from "lucide-react";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onDone: () => void;
}

const ALL = "__all__";

export default function BulkBlockDatesDialog({ onDone }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState<string>(ALL);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState<
    { id: string; name: string; total_units: number }[]
  >([]);

  const loadRooms = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("id, name, total_units")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    setRooms((data as any) ?? []);
  };

  const days = useMemo(() => {
    if (!start || !end) return [] as Date[];
    const s = parseISO(start);
    const e = parseISO(end);
    if (e < s) return [] as Date[];
    return eachDayOfInterval({ start: s, end: e });
  }, [start, end]);

  const targetRooms = roomId === ALL ? rooms : rooms.filter((r) => r.id === roomId);

  const summary =
    days.length > 0 && targetRooms.length > 0
      ? `${targetRooms.length === 1 ? targetRooms[0].name : `${targetRooms.length} room types`} — ${days.length} day${
          days.length === 1 ? "" : "s"
        }, ${format(days[0], "dd/MM/yyyy")} – ${format(
          days[days.length - 1],
          "dd/MM/yyyy"
        )}`
      : null;

  const reset = () => {
    setStart("");
    setEnd("");
    setReason("");
    setRoomId(ALL);
  };

  const apply = async (close: boolean) => {
    if (!summary) return;
    setSaving(true);
    try {
      const from = format(days[0], "yyyy-MM-dd");
      const to = format(days[days.length - 1], "yyyy-MM-dd");
      const ids = targetRooms.map((r) => r.id);

      // Preserve existing booked counts / totals for rows already in range
      const { data: existing, error: exErr } = await supabase
        .from("room_inventory")
        .select("room_id, date, total_count, booked_count, rate_override, min_stay")
        .in("room_id", ids)
        .gte("date", from)
        .lte("date", to);
      if (exErr) throw exErr;

      const existingMap = new Map(
        (existing ?? []).map((r: any) => [`${r.room_id}|${r.date}`, r])
      );

      const rows = targetRooms.flatMap((room) =>
        days.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const prev = existingMap.get(`${room.id}|${dateStr}`);
          return {
            room_id: room.id,
            date: dateStr,
            total_count: prev?.total_count ?? room.total_units ?? 1,
            booked_count: prev?.booked_count ?? 0,
            rate_override: prev?.rate_override ?? null,
            min_stay: prev?.min_stay ?? 1,
            is_closed: close,
            closure_reason: close && reason.trim() ? reason.trim() : null,
          };
        })
      );

      const booked = rows.filter((r) => r.booked_count > 0).length;

      const { error } = await supabase
        .from("room_inventory")
        .upsert(rows, { onConflict: "room_id,date" });
      if (error) throw error;

      toast({
        title: close ? "Dates blocked" : "Dates unblocked",
        description:
          `${rows.length} day-rows updated.` +
          (close && booked > 0
            ? ` Note: ${booked} of them already have bookings — those stay valid, only new bookings are stopped.`
            : ""),
      });
      setOpen(false);
      reset();
      onDone();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) loadRooms();
        else reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarOff className="w-4 h-4" />
          Block Dates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Block / Unblock Dates</DialogTitle>
          <DialogDescription>
            Make a room type unavailable to guests across a range of dates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Room type</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All room types</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input
                type="date"
                value={end}
                min={start || undefined}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Maintenance, private event…"
            />
          </div>

          {summary && (
            <p className="text-xs text-muted-foreground border border-border bg-muted/40 px-3 py-2">
              {summary}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            disabled={!summary || saving}
            onClick={() => apply(false)}
          >
            Unblock dates
          </Button>
          <Button disabled={!summary || saving} onClick={() => apply(true)}>
            {saving ? "Saving…" : "Block dates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
