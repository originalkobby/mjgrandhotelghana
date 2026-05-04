import { useState, useMemo, useRef } from "react";
import { StickyHorizontalScrollbar } from "@/components/ui/StickyHorizontalScrollbar";
import { motion } from "framer-motion";
import { Search, Filter, RefreshCw, Download, CreditCard, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatDateGB } from "@/lib/dateUtils";
import type { Database } from "@/integrations/supabase/types";
import { formatBookingLabel, getPaymentDisplay } from "@/lib/bookingLifecycle";
import { useBookingLifecycleSync } from "@/hooks/useBookingLifecycleSync";
import { useCurrency } from "@/contexts/CurrencyContext";
import { releaseInventory, reserveInventory, getInventoryAction } from "@/lib/inventorySync";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface BookingAddOn {
  id: string;
  quantity: number;
  unit_price_ghs: number;
  total_price_ghs: number;
  add_ons: { name: string; icon: string | null } | null;
}

interface Booking {
  id: string;
  reference_code: string;
  status: BookingStatus;
  payment_status: string;
  payment_method: string | null;
  booking_source: string;
  ota_reference: string | null;
  room_number: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  base_total_ghs: number;
  discount_ghs: number;
  add_ons_total_ghs: number;
  final_total_ghs: number;
  promo_code: string | null;
  special_requests: string | null;
  arrival_time: string | null;
  nationality: string | null;
  created_at: string;
  rooms: { name: string } | null;
  guests: { full_name: string; email: string; phone: string; preferences: any } | null;
  booking_add_ons: BookingAddOn[];
}

const STATUS_OPTIONS: BookingStatus[] = ["pending", "confirmed", "cancelled", "completed", "no_show"];

const STATUS_LABELS: Record<string, string> = {
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
  completed: "released",
  no_show: "no show",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-600 text-white border-green-700",
  pending: "bg-orange-500 text-white border-orange-600",
  cancelled: "bg-red-600 text-white border-red-700",
  completed: "bg-amber-800 text-white border-amber-900",
  no_show: "bg-[#722F37] text-white border-[#5a252c]",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-emerald-600 text-white border-emerald-700",
  pending: "bg-orange-500 text-white border-orange-600",
  failed: "bg-red-600 text-white border-red-700",
  partial: "bg-orange-500 text-white border-orange-600",
  refunded: "bg-slate-600 text-white border-slate-700",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  paystack: "Paystack",
  pay_at_hotel: "Pay at Hotel",
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct",
  booking_com: "Booking.com",
  expedia: "Expedia",
  airbnb: "Airbnb",
  agoda: "Agoda",
  siteminder: "SiteMinder",
  cloudbeds: "Cloudbeds",
  staah: "STAAH",
};

const SOURCE_COLORS: Record<string, string> = {
  direct: "bg-green-500/15 text-green-700 border-green-500/30",
  booking_com: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  expedia: "bg-teal-500/15 text-teal-700 border-teal-500/30",
  airbnb: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30",
  agoda: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  siteminder: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  cloudbeds: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30",
  staah: "bg-purple-500/15 text-purple-700 border-purple-500/30",
};

const SOURCE_OPTIONS = Object.keys(SOURCE_LABELS);

async function fetchBookings(statusFilter: string, sourceFilter: string) {
  let query = supabase
    .from("bookings")
    .select("id, reference_code, status, payment_status, payment_method, booking_source, ota_reference, room_number, check_in, check_out, adults, children, base_total_ghs, discount_ghs, add_ons_total_ghs, final_total_ghs, promo_code, special_requests, arrival_time, nationality, created_at, rooms(name), guests(full_name, email, phone, preferences), booking_add_ons(id, quantity, unit_price_ghs, total_price_ghs, add_ons(name, icon))")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter as BookingStatus);
  }
  if (sourceFilter !== "all") {
    query = query.eq("booking_source", sourceFilter);
  }

  const { data } = await query;
  return (data as unknown as Booking[]) ?? [];
}

export default function Bookings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus | "">("");
  const [roomNumber, setRoomNumber] = useState("");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Record payment
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Bulk delete bookings
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, role } = useAdminAuth();
  const { format: formatCurrency } = useCurrency();
  const isAdmin = role === "admin";
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const { data: allBookings = [], isLoading: loading, isFetching } = useQuery({
    queryKey: ["admin-bookings", statusFilter, sourceFilter],
    queryFn: () => fetchBookings(statusFilter, sourceFilter),
    staleTime: 30_000,
  });

  useBookingLifecycleSync({
    onSynced: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  // Try to parse the search as a date (DD/MM/YYYY, D/M/YYYY, or YYYY-MM-DD)
  const parseSearchDate = (raw: string): string | null => {
    const s = raw.trim();
    // ISO YYYY-MM-DD
    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) {
      const [, y, m, d] = iso;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    // British DD/MM/YYYY or D/M/YY(YY)
    const gb = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (gb) {
      const [, d, m, yRaw] = gb;
      const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return null;
  };

  const searchDate = parseSearchDate(search);

  const bookings = search.trim()
    ? allBookings.filter((b) => {
        // If query is a valid date, only return bookings whose stay covers that date
        if (searchDate) {
          return b.check_in <= searchDate && searchDate <= b.check_out;
        }
        const q = search.toLowerCase();
        return (
          b.reference_code.toLowerCase().includes(q) ||
          b.ota_reference?.toLowerCase().includes(q) ||
          b.guests?.full_name?.toLowerCase().includes(q) ||
          b.guests?.email?.toLowerCase().includes(q) ||
          b.guests?.phone?.toLowerCase().includes(q) ||
          b.room_number?.toLowerCase().includes(q)
        );
      })
    : allBookings;

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;
    setUpdating(true);

    const oldStatus = selectedBooking.status;
    const oldCheckIn = selectedBooking.check_in;
    const oldCheckOut = selectedBooking.check_out;
    const datesChanged = editCheckIn !== oldCheckIn || editCheckOut !== oldCheckOut;

    // Validate dates
    if (datesChanged) {
      if (!editCheckIn || !editCheckOut) {
        toast({ title: "Invalid dates", description: "Both check-in and check-out are required.", variant: "destructive" });
        setUpdating(false);
        return;
      }
      if (editCheckOut <= editCheckIn) {
        toast({ title: "Invalid dates", description: "Check-out must be after check-in.", variant: "destructive" });
        setUpdating(false);
        return;
      }
    }

    const wasActive = oldStatus === "pending" || oldStatus === "confirmed";

    // If dates changed AND booking blocks inventory, release the OLD nights first
    // so the inventory check / re-reserve uses a clean slate.
    if (datesChanged && wasActive) {
      try { await releaseInventory(selectedBooking.id); } catch (e) { console.error("release before date edit failed", e); }
    }

    const updatePayload: any = { status: newStatus as BookingStatus };
    if (newStatus === "completed") {
      updatePayload.payment_status = "paid";
    }
    if (roomNumber !== (selectedBooking.room_number ?? "")) {
      updatePayload.room_number = roomNumber || null;
    }
    if (datesChanged) {
      updatePayload.check_in = editCheckIn;
      updatePayload.check_out = editCheckOut;
    }

    const { error } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", selectedBooking.id);

    if (!error) {
      const willBeActive = newStatus === "pending" || newStatus === "confirmed";

      let inventoryNote: string | null = null;

      if (datesChanged && wasActive && willBeActive) {
        // Re-reserve at the new dates
        const nights = await reserveInventory(selectedBooking.id);
        inventoryNote = `Dates changed → re-reserved ${nights} night${nights === 1 ? "" : "s"} (${oldCheckIn}→${oldCheckOut} ⇒ ${editCheckIn}→${editCheckOut})`;
      } else if (datesChanged && wasActive && !willBeActive) {
        inventoryNote = `Dates changed and status released inventory (${oldCheckIn}→${oldCheckOut} ⇒ ${editCheckIn}→${editCheckOut})`;
      } else if (datesChanged && !wasActive && willBeActive) {
        const nights = await reserveInventory(selectedBooking.id);
        inventoryNote = `Dates changed → reserved ${nights} night${nights === 1 ? "" : "s"} at new dates`;
      } else {
        // No date change — handle pure status transition
        const action = getInventoryAction(oldStatus, newStatus);
        if (action === "release") {
          const nights = await releaseInventory(selectedBooking.id);
          inventoryNote = `Released ${nights} night${nights === 1 ? "" : "s"} of inventory`;
        } else if (action === "reserve") {
          const nights = await reserveInventory(selectedBooking.id);
          inventoryNote = `Re-booked ${nights} night${nights === 1 ? "" : "s"} of inventory`;
        }
      }

      const noteParts: string[] = [];
      if (roomNumber && roomNumber !== (selectedBooking.room_number ?? "")) {
        noteParts.push(`Room number assigned: ${roomNumber}`);
      }
      if (datesChanged) {
        noteParts.push(`Stay updated: ${oldCheckIn} → ${oldCheckOut} ⇒ ${editCheckIn} → ${editCheckOut}`);
      }
      if (inventoryNote) noteParts.push(inventoryNote);

      await supabase.from("booking_audit_log" as any).insert({
        booking_id: selectedBooking.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user?.id || null,
        note: noteParts.length > 0 ? noteParts.join(" · ") : null,
      });
    } else if (datesChanged && wasActive) {
      // Update failed — try to restore the old reservation
      try { await reserveInventory(selectedBooking.id); } catch (e) { console.error("rollback reserve failed", e); }
    }

    setUpdating(false);
    setSelectedBooking(null);
    setNewStatus("");
    setRoomNumber("");
    setEditCheckIn("");
    setEditCheckOut("");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Booking ${selectedBooking.reference_code} → ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    }
  };




  const handleRecordPayment = async () => {
    if (!paymentBooking || !paymentAmount) return;
    setRecordingPayment(true);

    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

      // Insert payment log
      await supabase.from("payment_logs").insert({
        booking_id: paymentBooking.id,
        amount_ghs: amount,
        provider: "manual",
        status: "success",
        provider_reference: `MANUAL-${Date.now()}`,
      });

      // Determine payment status
      const newPaymentStatus = amount >= paymentBooking.final_total_ghs ? "paid" : "partial";

      // Update booking payment status
      await supabase
        .from("bookings")
        .update({ payment_status: newPaymentStatus } as any)
        .eq("id", paymentBooking.id);

      toast({
        title: "Payment Recorded",
        description: `${formatCurrency(amount)} recorded for ${paymentBooking.reference_code}. Status: ${newPaymentStatus}`,
      });
      setShowPaymentDialog(false);
      setPaymentBooking(null);
      setPaymentAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDeleting(true);

    const idToBooking = new Map(bookings.map((b) => [b.id, b]));
    let success = 0;
    let failed = 0;

    let lastError: string | null = null;
    for (const id of ids) {
      const b = idToBooking.get(id);
      try {
        if (b && (b.status === "pending" || b.status === "confirmed")) {
          try { await releaseInventory(id); } catch { /* non-fatal */ }
        }
        // Related rows (booking_add_ons, payment_logs, booking_audit_log, webhook_logs)
        // are removed/nulled automatically via ON DELETE CASCADE / SET NULL.
        const { error } = await supabase.from("bookings").delete().eq("id", id);
        if (error) throw error;
        success++;
      } catch (err: any) {
        console.error("Delete booking failed:", id, err);
        lastError = err?.message ?? String(err);
        failed++;
      }
    }

    setDeleting(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());

    if (failed === 0) {
      toast({ title: "Bookings deleted", description: `${success} booking${success === 1 ? "" : "s"} permanently removed.` });
    } else {
      toast({
        title: failed === ids.length ? "Delete failed" : "Partial delete",
        description: failed === ids.length
          ? (lastError ?? "Could not delete bookings.")
          : `${success} deleted, ${failed} failed${lastError ? `: ${lastError}` : ""}.`,
        variant: failed === ids.length ? "destructive" : "default",
      });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  // Selection helpers
  const visibleIds = useMemo(() => bookings.map((b) => b.id), [bookings]);
  const selectedVisibleCount = useMemo(
    () => visibleIds.filter((id) => selectedIds.has(id)).length,
    [visibleIds, selectedIds]
  );
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedBookingsList = useMemo(
    () => bookings.filter((b) => selectedIds.has(b.id)),
    [bookings, selectedIds]
  );

  const exportCSV = () => {
    if (bookings.length === 0) return;
    const headers = ["Reference", "OTA Ref", "Guest", "Email", "Room", "Room #", "Check-in", "Check-out", "Adults", "Children", "Total (GHS)", "Status", "Source", "Payment", "Method", "Created"];
    const rows = bookings.map((b) => {
      const pd = getPaymentDisplay(b);
      return [
        b.reference_code,
        b.ota_reference ?? "",
        b.guests?.full_name ?? "",
        b.guests?.email ?? "",
        b.rooms?.name ?? "",
        b.room_number ?? "",
        formatDateGB(b.check_in),
        formatDateGB(b.check_out),
        b.adults,
        b.children,
        b.final_total_ghs,
        b.status,
        SOURCE_LABELS[b.booking_source] ?? b.booking_source,
        pd.isDash ? "--" : pd.label,
        PAYMENT_METHOD_LABELS[b.payment_method ?? "pay_at_hotel"] ?? b.payment_method ?? "—",
        formatDateGB(b.created_at),
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${formatDateGB(new Date().toISOString())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const refreshing = loading || isFetching;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl text-foreground">Bookings</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Manage reservations and update statuses
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, OTA ref, name, room #, date…"
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {STATUS_LABELS[s] ?? s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCE_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {SOURCE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-bookings"] })}
          disabled={refreshing}
          title="Refresh bookings"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={bookings.length === 0}
          title="Export as CSV"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Bulk selection toolbar (admin only) */}
      {isAdmin && selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-muted border border-border"
        >
          <p className="text-sm font-sans text-foreground">
            <span className="font-medium">{selectedIds.size}</span> booking{selectedIds.size === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs">
              <X className="w-3.5 h-3.5 mr-1" />
              Clear selection
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete {selectedIds.size} selected
            </Button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div ref={tableScrollRef} className="scrollbar-x-always">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  {isAdmin && (
                    <th className="w-8 px-3 py-3">
                      <Checkbox
                        className="h-3 w-3 [&_svg]:h-3 [&_svg]:w-3"
                        checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                        onCheckedChange={toggleAll}
                        aria-label="Select all bookings"
                      />
                    </th>
                  )}
                  {["Ref", "Guest", "Room", "Check-in", "Check-out", "Guests", "Total", "Status", "Source", "Payment", "Method", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: isAdmin ? 13 : 12 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 13 : 12} className="text-center py-12 text-muted-foreground">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((b, i) => {
                    const pd = getPaymentDisplay(b);
                    return (
                      <motion.tr
                        key={b.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        {isAdmin && (
                          <td className="px-3 py-3">
                            <Checkbox
                              className="h-3 w-3 [&_svg]:h-3 [&_svg]:w-3"
                              checked={selectedIds.has(b.id)}
                              onCheckedChange={() => toggleRow(b.id)}
                              aria-label={`Select ${b.reference_code}`}
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 font-mono text-xs">
                          {b.booking_source !== "direct" && b.ota_reference ? (
                            <div title={`Internal: ${b.reference_code}`}>{b.ota_reference}</div>
                          ) : (
                            <div>{b.reference_code}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{b.guests?.full_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{b.guests?.email ?? ""}</p>
                        </td>
                        <td className="px-4 py-3 text-foreground">{b.rooms?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateGB(b.check_in)}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateGB(b.check_out)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {b.adults}A{b.children > 0 ? ` ${b.children}C` : ""}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {formatCurrency(b.final_total_ghs)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[pd.effectiveStatus] ?? STATUS_COLORS[b.status] ?? ""}`}>
                            {STATUS_LABELS[pd.effectiveStatus] ?? formatBookingLabel(pd.effectiveStatus)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[b.booking_source] ?? "bg-muted text-muted-foreground border-border"}`}>
                            {SOURCE_LABELS[b.booking_source] ?? b.booking_source}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pd.isDash ? (
                            <span className="text-muted-foreground font-medium">--</span>
                          ) : (
                            <Badge variant="outline" className={`text-xs capitalize ${PAYMENT_COLORS[pd.label] ?? ""}`}>
                              {formatBookingLabel(pd.label)}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {PAYMENT_METHOD_LABELS[b.payment_method ?? "pay_at_hotel"] ?? b.payment_method ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setSelectedBooking(b);
                                setNewStatus(b.status);
                                setRoomNumber(b.room_number ?? "");
                              }}
                            >
                              Manage
                            </Button>


                            {b.payment_method === "pay_at_hotel" && pd.label !== "paid" && pd.effectiveStatus !== "cancelled" && pd.effectiveStatus !== "no_show" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-accent"
                                title="Record payment"
                                onClick={() => {
                                  setPaymentBooking(b);
                                  setPaymentAmount(String(b.final_total_ghs));
                                  setShowPaymentDialog(true);
                                }}
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </Button>
                            )}

                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <StickyHorizontalScrollbar targetRef={tableScrollRef} />
        </CardContent>
      </Card>

      {/* Status Update / Room Assignment Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(o) => { if (!o) { setSelectedBooking(null); setRoomNumber(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              Booking {selectedBooking?.reference_code}
            </DialogTitle>
            <DialogDescription className="font-sans">
              {selectedBooking?.guests?.full_name} — {selectedBooking?.rooms?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 font-sans text-sm">
              <div className="grid grid-cols-2 gap-3 text-muted-foreground">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Check-in</p>
                  <p className="text-foreground">{formatDateGB(selectedBooking.check_in)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Check-out</p>
                  <p className="text-foreground">{formatDateGB(selectedBooking.check_out)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Total</p>
                  <div className="text-foreground font-medium">
                    {formatCurrency(selectedBooking.final_total_ghs)}
                    {selectedBooking.discount_ghs > 0 && (
                      <span className="text-xs text-accent ml-1">
                        (−{formatCurrency(selectedBooking.discount_ghs)} promo{selectedBooking.promo_code ? `: ${selectedBooking.promo_code}` : ""})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Payment</p>
                  {(() => {
                    const pd = getPaymentDisplay(selectedBooking);
                    return pd.isDash ? (
                      <span className="text-muted-foreground font-medium">—</span>
                    ) : (
                      <Badge variant="outline" className={`text-xs capitalize ${PAYMENT_COLORS[pd.label] ?? ""}`}>
                        {pd.label}
                      </Badge>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="text-foreground">
                    {PAYMENT_METHOD_LABELS[selectedBooking.payment_method ?? "pay_at_hotel"] ?? selectedBooking.payment_method ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Source</p>
                  <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[selectedBooking.booking_source] ?? "bg-muted text-muted-foreground border-border"}`}>
                    {SOURCE_LABELS[selectedBooking.booking_source] ?? selectedBooking.booking_source}
                  </Badge>
                </div>
                {selectedBooking.ota_reference && (
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1">OTA Reference</p>
                    <p className="text-foreground font-mono text-xs">{selectedBooking.ota_reference}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Email</p>
                  <p className="text-foreground">{selectedBooking.guests?.email ?? "—"}</p>
                </div>
              </div>

              {selectedBooking.arrival_time && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Estimated Arrival Time</p>
                  <p className="text-foreground bg-muted p-2 rounded text-xs">{selectedBooking.arrival_time}</p>
                </div>
              )}

              {selectedBooking.guests?.preferences?.flight_itinerary && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Flight Itinerary</p>
                  <p className="text-foreground bg-muted p-2 rounded text-xs whitespace-pre-wrap">
                    {selectedBooking.guests.preferences.flight_itinerary}
                  </p>
                </div>
              )}

              {selectedBooking.booking_add_ons && selectedBooking.booking_add_ons.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-2 text-muted-foreground">Extras</p>
                  <div className="bg-muted rounded p-2 space-y-1.5">
                    {selectedBooking.booking_add_ons.map((ao) => (
                      <div key={ao.id} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">
                          {ao.add_ons?.name ?? "Extra"}
                          {ao.quantity > 1 && <span className="text-muted-foreground"> ×{ao.quantity}</span>}
                        </span>
                        <span className="text-foreground font-medium">{formatCurrency(ao.total_price_ghs)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1.5 border-t border-border text-xs">
                      <span className="text-muted-foreground">Extras subtotal</span>
                      <span className="text-foreground font-medium">{formatCurrency(selectedBooking.add_ons_total_ghs)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.special_requests && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Special Requests</p>
                  <p className="text-foreground bg-muted p-2 rounded text-xs">{selectedBooking.special_requests}</p>
                </div>
              )}


              <div>
                <p className="text-xs uppercase tracking-wider mb-2 text-muted-foreground">Update Status</p>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as BookingStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {STATUS_LABELS[s] ?? s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedBooking(null); setRoomNumber(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updating || (newStatus === selectedBooking?.status && roomNumber === (selectedBooking?.room_number ?? ""))}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {updating ? "Updating…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>




      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(o) => { if (!o) { setShowPaymentDialog(false); setPaymentBooking(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              Record Payment
            </DialogTitle>
            <DialogDescription className="font-sans">
              {paymentBooking?.reference_code} — {paymentBooking?.guests?.full_name}
              <br />
              Total due: <strong>{formatCurrency(paymentBooking?.final_total_ghs ?? 0)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="payment-amount" className="text-sm text-muted-foreground">
                Amount Received (GH₵)
              </Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g. 500"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Full amount marks as "Paid", partial marks as "Partial".
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPaymentDialog(false); setPaymentBooking(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {recordingPayment ? "Recording…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog (admin only) */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(o) => { if (!o && !deleting) setBulkDeleteOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Delete {selectedIds.size} booking{selectedIds.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              This will permanently remove the following booking{selectedIds.size === 1 ? "" : "s"} along with related add-ons, payment logs and audit history. This action cannot be undone.
              <span className="block mt-3 font-mono text-xs text-foreground">
                {selectedBookingsList.slice(0, 5).map((b) => b.ota_reference || b.reference_code).join(", ")}
                {selectedBookingsList.length > 5 && (
                  <span className="text-muted-foreground"> …and {selectedBookingsList.length - 5} more</span>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleBulkDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
