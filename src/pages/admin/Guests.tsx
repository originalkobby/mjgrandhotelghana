import { useState } from "react";
import { motion } from "framer-motion";
import { Search, RefreshCw, Star, Crown, Clock, LogIn, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDateGB, formatDateTimeGB } from "@/lib/dateUtils";

interface Guest {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  vip: boolean;
  created_at: string;
  preferences: any;
}

interface GuestBooking {
  id: string;
  reference_code: string;
  status: string;
  check_in: string;
  check_out: string;
  final_total_ghs: number;
  actual_check_in: string | null;
  actual_check_out: string | null;
  rooms: { name: string } | null;
}

async function fetchGuests() {
  const { data } = await supabase
    .from("guests")
    .select("id, full_name, email, phone, vip, created_at, preferences")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as Guest[]) ?? [];
}

async function fetchGuestBookings(guestId: string) {
  const { data } = await supabase
    .from("bookings")
    .select("id, reference_code, status, check_in, check_out, final_total_ghs, actual_check_in, actual_check_out, rooms(name)")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as unknown as GuestBooking[]) ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-accent/20 text-accent",
  pending: "bg-gold-light/20 text-gold-dark",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-accent/20 text-accent",
  no_show: "bg-muted text-muted-foreground",
};

export default function Guests() {
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [recordingBookingId, setRecordingBookingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allGuests = [], isLoading, isFetching } = useQuery({
    queryKey: ["admin-guests"],
    queryFn: fetchGuests,
    staleTime: 30_000,
  });

  const { data: guestBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-guest-bookings", selectedGuest?.id],
    queryFn: () => (selectedGuest ? fetchGuestBookings(selectedGuest.id) : Promise.resolve([])),
    enabled: !!selectedGuest,
  });

  const guests = search.trim()
    ? allGuests.filter((g) => {
        const q = search.toLowerCase();
        return (
          g.full_name?.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q) ||
          g.phone?.toLowerCase().includes(q)
        );
      })
    : allGuests;

  const toggleVIP = async (guest: Guest) => {
    const { error } = await supabase
      .from("guests")
      .update({ vip: !guest.vip } as any)
      .eq("id", guest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: guest.vip ? "VIP Removed" : "VIP Added", description: `${guest.full_name ?? "Guest"} updated.` });
      queryClient.invalidateQueries({ queryKey: ["admin-guests"] });
      if (selectedGuest?.id === guest.id) {
        setSelectedGuest({ ...guest, vip: !guest.vip });
      }
    }
  };

  const handleRecordCheckIn = async (bookingId: string) => {
    if (!checkInTime) return;
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({ actual_check_in: new Date(checkInTime).toISOString() } as any)
      .eq("id", bookingId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check-in Recorded" });
      queryClient.invalidateQueries({ queryKey: ["admin-guest-bookings"] });
      setRecordingBookingId(null);
      setCheckInTime("");
    }
  };

  const handleRecordCheckOut = async (bookingId: string) => {
    if (!checkOutTime) return;
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({ actual_check_out: new Date(checkOutTime).toISOString() } as any)
      .eq("id", bookingId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check-out Recorded" });
      queryClient.invalidateQueries({ queryKey: ["admin-guest-bookings"] });
      setRecordingBookingId(null);
      setCheckOutTime("");
    }
  };

  const rating = selectedGuest?.preferences?.last_chat_rating;
  const refreshing = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl text-foreground">Guests</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          View guest profiles, booking history, and VIP status
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-guests"] })}
          disabled={refreshing}
          title="Refresh guests"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  {["Name", "Email", "Phone", "VIP", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : guests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">No guests found</td>
                  </tr>
                ) : (
                  guests.map((g, i) => (
                    <motion.tr
                      key={g.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {g.full_name ?? "—"}
                          {g.vip && <Crown className="w-3.5 h-3.5 text-accent" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{g.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{g.phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleVIP(g)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            g.vip
                              ? "bg-accent/20 text-accent border-accent/30"
                              : "bg-muted text-muted-foreground border-border hover:border-accent/50"
                          }`}
                        >
                          {g.vip ? "VIP" : "Regular"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateGB(g.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setSelectedGuest(g)}
                        >
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Guest Detail Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={(o) => !o && setSelectedGuest(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              {selectedGuest?.full_name ?? "Guest"}
              {selectedGuest?.vip && <Crown className="w-4 h-4 text-accent" />}
            </DialogTitle>
            <DialogDescription className="font-sans">
              {selectedGuest?.email} · {selectedGuest?.phone ?? "No phone"}
            </DialogDescription>
          </DialogHeader>

          {selectedGuest && (
            <div className="space-y-4 font-sans text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Joined</p>
                  <p className="text-foreground">{formatDateGB(selectedGuest.created_at)}</p>
                </div>
                {rating && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Last Chat Rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"} />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleVIP(selectedGuest)}
                    className="text-xs"
                  >
                    {selectedGuest.vip ? "Remove VIP" : "Make VIP"}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Booking History & Check-in/out</p>
                {bookingsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : guestBookings.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No bookings found</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {guestBookings.map((b) => (
                      <div key={b.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-xs font-medium">{b.reference_code}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.rooms?.name ?? "Room"} · {formatDateGB(b.check_in)} → {formatDateGB(b.check_out)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground text-xs">GH₵ {Number(b.final_total_ghs).toLocaleString()}</p>
                            <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[b.status] ?? ""}`}>
                              {b.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>

                        {/* Check-in/out times */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <LogIn className="w-3 h-3 text-accent" />
                            <span className="text-muted-foreground">Check-in:</span>
                            {b.actual_check_in ? (
                              <span className="text-foreground font-medium">
                                {formatDateTimeGB(b.actual_check_in)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">Not recorded</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <LogOut className="w-3 h-3 text-destructive" />
                            <span className="text-muted-foreground">Check-out:</span>
                            {b.actual_check_out ? (
                              <span className="text-foreground font-medium">
                                {formatDateTimeGB(b.actual_check_out)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">Not recorded</span>
                            )}
                          </div>
                        </div>

                        {/* Record buttons */}
                        {(b.status === "confirmed" || b.status === "completed") && (
                          <div className="pt-1">
                            {recordingBookingId === b.id ? (
                              <div className="space-y-2 bg-card p-2 rounded border border-border">
                                {!b.actual_check_in && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs shrink-0">Check-in:</Label>
                                    <Input
                                      type="datetime-local"
                                      value={checkInTime}
                                      onChange={(e) => setCheckInTime(e.target.value)}
                                      className="h-7 text-xs flex-1"
                                      step="1"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleRecordCheckIn(b.id)}
                                      disabled={saving || !checkInTime}
                                      className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                                    >
                                      Save
                                    </Button>
                                  </div>
                                )}
                                {b.actual_check_in && !b.actual_check_out && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs shrink-0">Check-out:</Label>
                                    <Input
                                      type="datetime-local"
                                      value={checkOutTime}
                                      onChange={(e) => setCheckOutTime(e.target.value)}
                                      className="h-7 text-xs flex-1"
                                      step="1"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleRecordCheckOut(b.id)}
                                      disabled={saving || !checkOutTime}
                                      className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                                    >
                                      Save
                                    </Button>
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-6"
                                  onClick={() => { setRecordingBookingId(null); setCheckInTime(""); setCheckOutTime(""); }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              (!b.actual_check_in || (b.actual_check_in && !b.actual_check_out)) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 gap-1.5"
                                  onClick={() => {
                                    setRecordingBookingId(b.id);
                                    setCheckInTime("");
                                    setCheckOutTime("");
                                  }}
                                >
                                  <Clock className="w-3 h-3" />
                                  {!b.actual_check_in ? "Record Check-in" : "Record Check-out"}
                                </Button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}