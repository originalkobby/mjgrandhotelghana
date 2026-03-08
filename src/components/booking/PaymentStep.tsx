import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Smartphone, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedRoom, SelectedAddOn, GuestInfo } from "@/hooks/useBooking";

interface Props {
  selectedRoom: SelectedRoom;
  selectedAddOns: SelectedAddOn[];
  guestInfo: GuestInfo;
  totalAmount: number;
  bookingReference: string | null;
  onPaymentComplete: () => void;
  onBack: () => void;
}

export default function PaymentStep({
  selectedRoom,
  selectedAddOns,
  guestInfo,
  totalAmount,
  bookingReference,
  onPaymentComplete,
  onBack,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);

  const handlePayWithPaystack = async () => {
    if (!bookingReference) return;
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("paystack", {
        body: {
          action: "initialize",
          email: guestInfo.email,
          amount_ghs: totalAmount,
          booking_reference: bookingReference,
          callback_url: `${window.location.origin}/booking?verify=${bookingReference}`,
        },
      });

      if (fnError || !data?.authorization_url) {
        throw new Error(fnError?.message || "Failed to initialize payment");
      }

      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error("Payment init error:", err);
      setError(err.message || "Could not start payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePayLater = () => {
    // Skip payment, proceed to confirmation with pending status
    onPaymentComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to details
      </button>
      <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8">Payment</h2>

      {/* Order summary */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h3 className="font-serif text-lg text-foreground mb-4">Order Summary</h3>
        <div className="space-y-3 text-sm font-sans">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {selectedRoom.name} × {selectedRoom.totalNights} night{selectedRoom.totalNights !== 1 ? "s" : ""}
            </span>
            <span className="text-foreground">GH₵ {selectedRoom.totalPrice.toLocaleString()}</span>
          </div>
          {selectedAddOns.map((a) => (
            <div key={a.id} className="flex justify-between">
              <span className="text-muted-foreground">{a.name}</span>
              <span className="text-foreground">GH₵ {(a.price_ghs * a.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
            <span className="text-foreground">Total Due</span>
            <span className="text-accent">GH₵ {totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Reference */}
      {bookingReference && (
        <div className="bg-secondary rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
          <div>
            <p className="font-sans text-xs text-muted-foreground">Booking Reference</p>
            <p className="font-serif text-lg text-foreground tracking-wide">{bookingReference}</p>
          </div>
        </div>
      )}

      {/* Payment methods */}
      <div className="space-y-3">
        <Button
          onClick={handlePayWithPaystack}
          disabled={isProcessing || !bookingReference}
          className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 font-sans text-sm font-semibold uppercase tracking-wider gap-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" /> Pay with Paystack
            </>
          )}
        </Button>

        <div className="flex items-center gap-4 text-xs font-sans text-muted-foreground justify-center">
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Cards
          </span>
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Mobile Money
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Bank Transfer
          </span>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm font-sans text-destructive text-center">
            {error}
          </div>
        )}

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-xs font-sans text-muted-foreground uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handlePayLater}
          disabled={isProcessing}
          className="w-full h-12 font-sans text-sm border-accent text-accent hover:bg-accent hover:text-accent-foreground uppercase tracking-wider"
        >
          Pay at Hotel — Reserve Now
        </Button>
        <p className="text-center text-xs font-sans text-muted-foreground">
          Your room will be held. Payment collected at check-in.
        </p>
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs font-sans text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> PCI DSS Compliant
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          256-bit SSL Encryption
        </span>
      </div>
    </motion.div>
  );
}
