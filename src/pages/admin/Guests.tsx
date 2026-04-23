import { useState } from "react";
import { motion } from "framer-motion";
import FlagIcon, { getIsoFromPhone } from "@/components/FlagIcon";
import { Search, RefreshCw, Star, Crown, Clock, LogIn, LogOut, DoorOpen, CalendarPlus, Plane, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useCurrency } from "@/contexts/CurrencyContext";

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
  room_number: string | null;
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
    .select("id, reference_code, status, check_in, check_out, final_total_ghs, actual_check_in, actual_check_out, room_number, rooms(name)")
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

// SVG flag components for common nationalities based on phone codes

export default function Guests() {
  const { format: formatCurrency } = useCurrency();
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [recordingBookingId, setRecordingBookingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingGuests, setDeletingGuests] = useState(false);
  // Extend checkout
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendBookingId, setExtendBookingId] = useState<string | null>(null);
  const [extendBookingRef, setExtendBookingRef] = useState("");
  const [extendCurrentCheckout, setExtendCurrentCheckout] = useState("");
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [extending, setExtending] = useState(false);
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

  const allVisibleSelected = guests.length > 0 && guests.every((g) => selectedGuestIds.includes(g.id));
  const selectedGuestCount = selectedGuestIds.length;

  const toggleGuestSelection = (guestId: string, checked: boolean) => {
    setSelectedGuestIds((current) =>
      checked ? Array.from(new Set([...current, guestId])) : current.filter((id) => id !== guestId),
    );
  };

  const toggleAllVisibleGuests = (checked: boolean) => {
    const visibleIds = guests.map((g) => g.id);
    setSelectedGuestIds((current) =>
      checked ? Array.from(new Set([...current, ...visibleIds])) : current.filter((id) => !visibleIds.includes(id)),
    );
  };

  const handleDeleteGuests = async () => {
    if (selectedGuestIds.length === 0) return;
    setDeletingGuests(true);
    try {
      const ids = selectedGuestIds;
      const clearGuestLinks = ["bookings", "support_tickets", "conversations"].map((table) =>
        supabase.from(table as any).update({ guest_id: null }).in("guest_id", ids),
      );
      const linkResults = await Promise.all(clearGuestLinks);
      const linkError = linkResults.find((result) => result.error)?.error;
      if (linkError) throw linkError;

      const { error } = await supabase.from("guests").delete().in("id", ids);
      if (error) throw error;

      toast({
        title: selectedGuestCount === 1 ? "Guest deleted" : "Guests deleted",
        description: `${selectedGuestCount} record${selectedGuestCount === 1 ? "" : "s"} removed.`,
      });
      setSelectedGuestIds([]);
      setSelectedGuest((current) => (current && ids.includes(current.id) ? null : current));
      queryClient.invalidateQueries({ queryKey: ["admin-guests"] });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeletingGuests(false);
      setShowDeleteDialog(false);
    }
  };

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

  const handleExtendCheckout = async () => {
    if (!extendBookingId || !newCheckOutDate) return;
    setExtending(true);
    try {
      const { data, error } = await supabase.functions.invoke("extend-checkout", {
        body: { bookingId: extendBookingId, newCheckOut: newCheckOutDate },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Checkout Extended",
        description: `+${data.extraNights} night(s), +${formatCurrency(data.extraCost)}. New total: ${formatCurrency(data.newFinalTotal)}`,
      });
      setShowExtendDialog(false);
      setExtendBookingId(null);
      setNewCheckOutDate("");
      queryClient.invalidateQueries({ queryKey: ["admin-guest-bookings"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setExtending(false);
    }
  };

  // Get latest room # for a guest from their bookings
  const getGuestRoomNumber = (guestId: string): string | null => {
    if (selectedGuest?.id === guestId && guestBookings.length > 0) {
      const activeBooking = guestBookings.find(b => b.status === "confirmed" || b.status === "completed");
      return activeBooking?.room_number ?? null;
    }
    return null;
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
        {selectedGuestCount > 0 && (
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deletingGuests}
          >
            <Trash2 className="w-4 h-4" />
            Delete {selectedGuestCount} record{selectedGuestCount === 1 ? "" : "s"}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-9 px-3 py-3">
                    <Checkbox
                      className="h-3 w-3 [&_svg]:h-3 [&_svg]:w-3"
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) => toggleAllVisibleGuests(checked === true)}
                      aria-label="Select all visible guests"
                    />
                  </th>
                  {["Name", "Email", "Phone", "VIP", "Date", "Actions"].map((h) => (
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
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : guests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">No guests found</td>
                  </tr>
                ) : (
                  guests.map((g, i) => {
                    const isoCode = getIsoFromPhone(g.phone);
                    return (
                      <motion.tr
                        key={g.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-3">
                          <Checkbox
                            className="h-3 w-3 [&_svg]:h-3 [&_svg]:w-3"
                            checked={selectedGuestIds.includes(g.id)}
                            onCheckedChange={(checked) => toggleGuestSelection(g.id, checked === true)}
                            aria-label={`Select ${g.full_name ?? "guest"}`}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            {g.full_name ?? "—"}
                            {g.vip && <Crown className="w-3.5 h-3.5 text-accent" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{g.email ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            {isoCode && <FlagIcon code={isoCode} size={16} />}
                            {g.phone ?? "—"}
                          </span>
                        </td>
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
                    );
                  })
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
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Date</p>
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

              {/* Flight Itinerary */}
              {selectedGuest.preferences?.flight_itinerary && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Plane className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Flight Itinerary</p>
                    <p className="text-foreground font-medium">{selectedGuest.preferences.flight_itinerary}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Booking History & Room Assignment</p>
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
                            <p className="font-medium text-foreground text-xs">{formatCurrency(b.final_total_ghs)}</p>
                            <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[b.status] ?? ""}`}>
                              {b.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>

                        {/* Room Number */}
                        {b.room_number && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <DoorOpen className="w-3 h-3 text-primary" />
                            <span className="text-muted-foreground">Room #:</span>
                            <span className="text-foreground font-medium font-mono">{b.room_number}</span>
                          </div>
                        )}

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
                            {(b.status === "confirmed" || b.status === "completed") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 gap-1.5"
                                onClick={() => {
                                  setExtendBookingId(b.id);
                                  setExtendBookingRef(b.reference_code);
                                  setExtendCurrentCheckout(b.check_out);
                                  setNewCheckOutDate("");
                                  setShowExtendDialog(true);
                                }}
                              >
                                <CalendarPlus className="w-3 h-3" />
                                Extend Checkout
                              </Button>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete selected guest records?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedGuestCount} guest record{selectedGuestCount === 1 ? "" : "s"}. Existing bookings, support tickets, and conversations will remain, but will no longer be linked to these guests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingGuests}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGuests} disabled={deletingGuests} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingGuests ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend Checkout Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={(o) => { if (!o) { setShowExtendDialog(false); setExtendBookingId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-accent" />
              Extend Checkout
            </DialogTitle>
            <DialogDescription className="font-sans">
              {extendBookingRef} — {selectedGuest?.full_name}
              <br />
              Current check-out: <strong>{extendCurrentCheckout ? formatDateGB(extendCurrentCheckout) : ""}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm text-muted-foreground">
                New Check-out Date
              </Label>
              <Input
                type="date"
                value={newCheckOutDate}
                onChange={(e) => setNewCheckOutDate(e.target.value)}
                min={extendCurrentCheckout ? new Date(new Date(extendCurrentCheckout).getTime() + 86400000).toISOString().split("T")[0] : ""}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowExtendDialog(false); setExtendBookingId(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleExtendCheckout}
              disabled={extending || !newCheckOutDate}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {extending ? "Extending…" : "Extend Checkout"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
