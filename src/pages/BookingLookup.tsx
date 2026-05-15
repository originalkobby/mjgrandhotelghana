import { useState } from "react";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import { Search, Calendar, Users, CreditCard, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatBookingLabel, getPaymentDisplay } from "@/lib/bookingLifecycle";
import { lookupBookingByReference } from "@/lib/bookingLookup";
import { useBookingLifecycleSync } from "@/hooks/useBookingLifecycleSync";
import { useCurrency } from "@/contexts/CurrencyContext";
import PriceDisplay from "@/components/PriceDisplay";

interface BookingResult {
  id: string;
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
  discount_ghs: number;
  special_requests: string | null;
  arrival_time: string | null;
  created_at: string;
  rooms: { name: string } | null;
  guests: { full_name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-accent/20 text-accent border-accent/30",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-accent/20 text-accent border-accent/30",
  no_show: "bg-muted text-muted-foreground border-border",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-accent/20 text-accent",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-destructive/10 text-destructive",
  partial: "bg-yellow-100 text-yellow-800",
  refunded: "bg-muted text-muted-foreground",
};

const BookingLookup = () => {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  useBookingLifecycleSync({
    enabled: !!result,
    onSynced: async () => {
      const latest = await lookupBookingByReference<BookingResult>(
        supabase,
        result?.reference_code ?? reference,
      );

      if (latest) setResult(latest);
    },
  });

  const handleLookup = async () => {
    const ref = reference.trim().toUpperCase();
    if (!ref) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const data = await lookupBookingByReference<BookingResult>(
        supabase,
        ref,
      );

      if (data) {
        setResult(data as unknown as BookingResult);
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!result) return;
    setCancelling(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("cancel-booking", {
        body: { referenceCode: result.reference_code },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResult({ ...result, status: "cancelled" });
      setShowCancelDialog(false);
      toast({ title: "Booking Cancelled", description: `Booking ${result.reference_code} has been cancelled.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const paymentDisplay = result ? getPaymentDisplay(result) : null;
  const displayStatus = paymentDisplay?.effectiveStatus ?? result?.status ?? "pending";

  const canCancel = result && (result.status === "confirmed" || result.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Find My Booking — MJ Grand Hotel Ghana" description="Look up an existing reservation at MJ Grand Hotel using your booking reference or email." path="/booking/lookup" />
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
              Look Up Your Booking
            </h1>
            <p className="font-sans text-muted-foreground">
              Enter your booking reference code to view your reservation details
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="MJ-XXXXXXXX"
                className="pl-10 font-mono tracking-wider"
              />
            </div>
            <Button
              onClick={handleLookup}
              disabled={loading || !reference.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? "Searching…" : "Look Up"}
            </Button>
          </motion.div>

          {notFound && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <p className="font-sans">No booking found with reference <strong>{reference}</strong></p>
              <p className="text-sm mt-2">Please check the code and try again.</p>
            </motion.div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-lg font-semibold text-foreground">
                        {result.reference_code}
                      </p>
                      <p className="font-sans text-sm text-muted-foreground mt-1">
                        Booked on {format(new Date(result.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Badge variant="outline" className={`capitalize ${STATUS_COLORS[displayStatus] ?? ""}`}>
                          {formatBookingLabel(displayStatus)}
                      </Badge>
                        {paymentDisplay?.isDash ? (
                          <span className="min-w-10 text-center font-medium text-muted-foreground">--</span>
                        ) : (
                          <Badge variant="secondary" className={`capitalize ${PAYMENT_COLORS[paymentDisplay?.label ?? result.payment_status] ?? ""}`}>
                            {formatBookingLabel(paymentDisplay?.label ?? result.payment_status)}
                          </Badge>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Check-in</p>
                        <p className="text-foreground font-medium">
                          {format(new Date(result.check_in), "EEE, MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Check-out</p>
                        <p className="text-foreground font-medium">
                          {format(new Date(result.check_out), "EEE, MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Guests</p>
                        <p className="text-foreground font-medium">
                          {result.adults} Adult{result.adults > 1 ? "s" : ""}
                          {result.children > 0 ? `, ${result.children} Child${result.children > 1 ? "ren" : ""}` : ""}
                        </p>
                      </div>
                    </div>
                    {result.rooms && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Room</p>
                        <p className="text-foreground font-medium">{result.rooms.name}</p>
                      </div>
                    )}
                    {result.guests && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Guest</p>
                          <p className="text-foreground font-medium">{result.guests.full_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                          <p className="text-foreground font-medium">{result.guests.email}</p>
                        </div>
                      </>
                    )}
                    {result.arrival_time && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Arrival Time</p>
                          <p className="text-foreground font-medium">{result.arrival_time}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2 text-sm font-sans">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Room Total</span>
                      <PriceDisplay amount={result.base_total_ghs} showBoth />
                    </div>
                    {Number(result.add_ons_total_ghs) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Add-ons</span>
                        <PriceDisplay amount={result.add_ons_total_ghs} showBoth />
                      </div>
                    )}
                    {Number(result.discount_ghs) > 0 && (
                      <div className="flex justify-between text-accent">
                        <span>Discount</span>
                        <PriceDisplay amount={result.discount_ghs} showBoth prefix="-" />
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-foreground text-base pt-1 border-t border-border">
                      <span>Total</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        <PriceDisplay amount={result.final_total_ghs} showBoth />
                      </span>
                    </div>
                  </div>

                  {result.special_requests && (
                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Special Requests</p>
                      <p className="text-foreground bg-muted p-3 rounded-lg">{result.special_requests}</p>
                    </div>
                  )}

                  {canCancel && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Cancel Booking
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Free cancellation up to 48 hours before check-in
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Cancel Booking?</DialogTitle>
            <DialogDescription className="font-sans">
              Are you sure you want to cancel booking <strong>{result?.reference_code}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Yes, Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingLookup;
