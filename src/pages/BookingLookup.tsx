import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CalendarDays, Users, CreditCard, MapPin, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BookingResult {
  reference_code: string;
  status: string;
  payment_status: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  final_total_ghs: number;
  base_total_ghs: number;
  add_ons_total_ghs: number;
  special_requests: string | null;
  arrival_time: string | null;
  created_at: string;
  rooms: { name: string } | null;
  guests: { full_name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 text-gray-800",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  partial: "bg-blue-100 text-blue-800",
  refunded: "bg-purple-100 text-purple-800",
  failed: "bg-red-100 text-red-800",
};

const BookingLookup = () => {
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleLookup = async () => {
    const ref = reference.trim().toUpperCase();
    if (!ref) {
      toast({ title: "Please enter a booking reference", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("reference_code, status, payment_status, check_in, check_out, adults, children, final_total_ghs, base_total_ghs, add_ons_total_ghs, special_requests, arrival_time, created_at, rooms(name), guests(full_name, email)")
        .eq("reference_code", ref)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
      } else {
        setResult(data as any);
      }
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
              Booking Lookup
            </h1>
            <p className="text-muted-foreground">
              Enter your booking reference code to view your reservation details.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 mb-8"
          >
            <Input
              placeholder="e.g. MJ-A1B2C3D4"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="h-12 text-base font-mono tracking-wider uppercase"
            />
            <Button
              onClick={handleLookup}
              disabled={loading}
              className="h-12 px-6 bg-accent text-accent-foreground hover:bg-accent/90 uppercase tracking-wider"
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Look Up"}
            </Button>
          </motion.div>

          {/* Not Found */}
          {notFound && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 border border-border rounded-xl"
            >
              <p className="text-muted-foreground text-lg">
                No booking found for <span className="font-mono font-semibold text-foreground">{reference}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please check your reference code and try again.
              </p>
            </motion.div>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-accent rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-accent/10 px-6 py-5 border-b border-accent/20">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Booking Reference</p>
                    <p className="font-mono text-xl font-bold text-foreground">{result.reference_code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={STATUS_COLORS[result.status] || ""}>
                      {result.status.toUpperCase()}
                    </Badge>
                    <Badge className={PAYMENT_COLORS[result.payment_status] || ""}>
                      {result.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="px-6 py-5 space-y-4">
                {/* Guest */}
                {result.guests && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 mt-1 text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{result.guests.full_name}</p>
                      <p className="text-xs text-muted-foreground">{result.guests.email}</p>
                    </div>
                  </div>
                )}

                {/* Room */}
                {result.rooms && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-sm text-foreground">{result.rooms.name}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-accent shrink-0" />
                  <p className="text-sm text-foreground">
                    {format(new Date(result.check_in), "MMM d, yyyy")} → {format(new Date(result.check_out), "MMM d, yyyy")}
                  </p>
                </div>

                {/* Guests count */}
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-accent shrink-0" />
                  <p className="text-sm text-foreground">
                    {result.adults} Adult{result.adults > 1 ? "s" : ""}{result.children > 0 ? `, ${result.children} Child${result.children > 1 ? "ren" : ""}` : ""}
                  </p>
                </div>

                {/* Arrival time */}
                {result.arrival_time && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-sm text-foreground">Arrival: {result.arrival_time}</p>
                  </div>
                )}

                {/* Special requests */}
                {result.special_requests && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Special Requests</p>
                    <p className="text-sm text-foreground">{result.special_requests}</p>
                  </div>
                )}

                {/* Pricing */}
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Room Total</span>
                    <span className="text-foreground">GH₵{Number(result.base_total_ghs).toLocaleString()}</span>
                  </div>
                  {Number(result.add_ons_total_ghs) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Add-ons</span>
                      <span className="text-foreground">GH₵{Number(result.add_ons_total_ghs).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="text-accent">GH₵{Number(result.final_total_ghs).toLocaleString()}</span>
                  </div>
                </div>

                {/* Booked date */}
                <p className="text-xs text-muted-foreground pt-2">
                  Booked on {format(new Date(result.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingLookup;
