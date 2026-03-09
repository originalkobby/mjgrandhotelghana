import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, RefreshCw, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface Booking {
  id: string;
  reference_code: string;
  status: BookingStatus;
  payment_status: string;
  payment_method: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  final_total_ghs: number;
  special_requests: string | null;
  created_at: string;
  rooms: { name: string } | null;
  guests: { full_name: string; email: string; phone: string } | null;
}

const STATUS_OPTIONS: BookingStatus[] = ["pending", "confirmed", "cancelled", "completed", "no_show"];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-accent/20 text-accent border-accent/30",
  pending: "bg-gold-light/20 text-gold-dark border-gold-light/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-accent/20 text-accent border-accent/30",
  no_show: "bg-muted text-muted-foreground border-border",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-accent/20 text-accent border-accent/30",
  pending: "bg-gold-light/20 text-gold-dark border-gold-light/30",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-gold-light/20 text-gold-dark border-gold-light/30",
  refunded: "bg-muted text-muted-foreground border-border",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  paystack: "Paystack",
  pay_at_hotel: "Pay at Hotel",
};

async function fetchBookings(statusFilter: string) {
  let query = supabase
    .from("bookings")
    .select("id, reference_code, status, payment_status, payment_method, check_in, check_out, adults, children, final_total_ghs, special_requests, created_at, rooms(name), guests(full_name, email, phone)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter as BookingStatus);
  }

  const { data } = await query;
  return (data as unknown as Booking[]) ?? [];
}

export default function Bookings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus | "">("");
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAdminAuth();

  const { data: allBookings = [], isLoading: loading, isFetching } = useQuery({
    queryKey: ["admin-bookings", statusFilter],
    queryFn: () => fetchBookings(statusFilter),
    staleTime: 30_000,
  });

  const bookings = search.trim()
    ? allBookings.filter((b) => {
        const q = search.toLowerCase();
        return (
          b.reference_code.toLowerCase().includes(q) ||
          b.guests?.full_name?.toLowerCase().includes(q) ||
          b.guests?.email?.toLowerCase().includes(q) ||
          b.guests?.phone?.toLowerCase().includes(q)
        );
      })
    : allBookings;

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;
    setUpdating(true);

    const oldStatus = selectedBooking.status;

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus as BookingStatus })
      .eq("id", selectedBooking.id);

    if (!error) {
      await supabase.from("booking_audit_log" as any).insert({
        booking_id: selectedBooking.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user?.id || null,
      });
    }

    setUpdating(false);
    setSelectedBooking(null);
    setNewStatus("");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Booking ${selectedBooking.reference_code} → ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  };

  const exportCSV = () => {
    if (bookings.length === 0) return;
    const headers = ["Reference", "Guest", "Email", "Room", "Check-in", "Check-out", "Adults", "Children", "Total (GHS)", "Status", "Payment", "Method", "Created"];
    const rows = bookings.map((b) => [
      b.reference_code,
      b.guests?.full_name ?? "",
      b.guests?.email ?? "",
      b.rooms?.name ?? "",
      b.check_in,
      b.check_out,
      b.adults,
      b.children,
      b.final_total_ghs,
      b.status,
      b.status === "cancelled" ? "--" : b.payment_status,
      PAYMENT_METHOD_LABELS[b.payment_method ?? "pay_at_hotel"] ?? b.payment_method ?? "—",
      b.created_at.split("T")[0],
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
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
            placeholder="Search by ref, name, or email…"
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
                {s.replace("_", " ")}
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

      {/* Table — Phone column removed, Payment Method column added */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  {["Ref", "Guest", "Room", "Check-in", "Check-out", "Guests", "Total", "Status", "Payment", "Method", "Actions"].map((h) => (
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
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-muted-foreground">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((b, i) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{b.reference_code}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{b.guests?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{b.guests?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{b.rooms?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{b.check_in}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{b.check_out}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.adults}A{b.children > 0 ? ` ${b.children}C` : ""}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        GH₵ {Number(b.final_total_ghs).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[b.status] ?? ""}`}>
                          {b.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {b.status === "cancelled" ? (
                          <span className="text-muted-foreground font-medium">—</span>
                        ) : (
                          <Badge variant="outline" className={`text-xs capitalize ${PAYMENT_COLORS[b.payment_status] ?? ""}`}>
                            {b.payment_status}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {PAYMENT_METHOD_LABELS[b.payment_method ?? "pay_at_hotel"] ?? b.payment_method ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setSelectedBooking(b);
                            setNewStatus(b.status);
                          }}
                        >
                          Manage
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

      {/* Status Update Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(o) => !o && setSelectedBooking(null)}>
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
                  <p className="text-foreground">{selectedBooking.check_in}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Check-out</p>
                  <p className="text-foreground">{selectedBooking.check_out}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Total</p>
                  <p className="text-foreground font-medium">
                    GH₵ {Number(selectedBooking.final_total_ghs).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Payment</p>
                  {selectedBooking.status === "cancelled" ? (
                    <span className="text-muted-foreground font-medium">—</span>
                  ) : (
                    <Badge variant="outline" className={`text-xs capitalize ${PAYMENT_COLORS[selectedBooking.payment_status] ?? ""}`}>
                      {selectedBooking.payment_status}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="text-foreground">
                    {PAYMENT_METHOD_LABELS[selectedBooking.payment_method ?? "pay_at_hotel"] ?? selectedBooking.payment_method ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Email</p>
                  <p className="text-foreground">{selectedBooking.guests?.email ?? "—"}</p>
                </div>
              </div>

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
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === selectedBooking?.status}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {updating ? "Updating…" : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
