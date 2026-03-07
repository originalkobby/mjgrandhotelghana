import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, RefreshCw } from "lucide-react";
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
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface Booking {
  id: string;
  reference_code: string;
  status: BookingStatus;
  payment_status: string;
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

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus | "">("");
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select("id, reference_code, status, payment_status, check_in, check_out, adults, children, final_total_ghs, special_requests, created_at, rooms(name), guests(full_name, email, phone)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as BookingStatus);
    }

    const { data } = await query;
    let results = (data as unknown as Booking[]) ?? [];

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (b) =>
          b.reference_code.toLowerCase().includes(q) ||
          b.guests?.full_name?.toLowerCase().includes(q) ||
          b.guests?.email?.toLowerCase().includes(q) ||
          b.guests?.phone?.toLowerCase().includes(q)
      );
    }

    setBookings(results);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;
    setUpdating(true);

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus as BookingStatus })
      .eq("id", selectedBooking.id);

    setUpdating(false);
    setSelectedBooking(null);
    setNewStatus("");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Booking ${selectedBooking.reference_code} → ${newStatus}` });
      fetchBookings();
    }
  };

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
            placeholder="Search by ref, name, email, or phone…"
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
        <Button variant="outline" size="icon" onClick={fetchBookings} disabled={loading} title="Refresh bookings">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  {["Ref", "Guest", "Phone", "Room", "Check-in", "Check-out", "Guests", "Total", "Status", "Payment", "Actions"].map((h) => (
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
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {b.guests?.phone ?? "—"}
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
                        <Badge variant="outline" className={`text-xs capitalize ${PAYMENT_COLORS[b.payment_status] ?? ""}`}>
                          {b.payment_status}
                        </Badge>
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
                  <Badge variant="outline" className={`text-xs capitalize ${PAYMENT_COLORS[selectedBooking.payment_status] ?? ""}`}>
                    {selectedBooking.payment_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-foreground">{selectedBooking.guests?.phone ?? "—"}</p>
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
