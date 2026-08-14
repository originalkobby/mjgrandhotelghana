import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Smartphone, Shield, CheckCircle2, Loader2, AlertCircle, BadgePercent } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedRoom, GroupRoom, SelectedAddOn, GuestInfo, AppliedPromo } from "@/hooks/useBooking";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  selectedRoom: SelectedRoom;
  groupRooms?: GroupRoom[];
  selectedAddOns: SelectedAddOn[];
  guestInfo: GuestInfo;
  totalAmount: number;
  appliedPromo?: AppliedPromo | null;
  promoError?: string | null;
  bookingReference: string | null;
  onPaymentComplete: () => void;
  onBack: () => void;
}

export default function PaymentStep({
  selectedRoom,
  groupRooms,
  selectedAddOns,
  guestInfo,
  totalAmount,
  appliedPromo,
  promoError,
  bookingReference,
  onPaymentComplete,
  onBack,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toUsd, toGhs } = useCurrency();

  const handlePayWithPaystack = async () => {
    if (!bookingReference) return;
    setIsProcessing(true);
    setError(null);

    try {
      // Update payment method to paystack
      await supabase
        .from("bookings")
        .update({ payment_method: "paystack" } as any)
        .eq("reference_code", bookingReference);

      const { data, error: fnError } = await supabase.functions.invoke("paystack", {
        body: {
          action: "initialize",
          email: guestInfo.email,
          booking_reference: bookingReference,
          callback_url: `${window.location.origin}/booking?verify=${bookingReference}&e=${encodeURIComponent(guestInfo.email)}`,
        },
      });

      if (fnError || !data?.authorization_url) {
        throw new Error(fnError?.message || "Failed to initialize payment");
      }

      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error("Payment init error:", err);
      setError(err.message || "Could not start payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePayLater = async () => {
    // payment_method defaults to 'pay_at_hotel' in DB
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
        <h3 className="font-serif text-lg text-foreground mb-4">Booking Summary</h3>
        <div className="space-y-3 text-sm font-sans">
          {groupRooms && groupRooms.length > 0 ? (
            groupRooms.map((r) => (
              <div key={r.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {r.name} × {r.quantity} room{r.quantity !== 1 ? "s" : ""} × {r.totalNights} night
                  {r.totalNights !== 1 ? "s" : ""}
                </span>
                <span className="text-foreground">{toUsd(r.totalPrice * r.quantity)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {selectedRoom.name} × {selectedRoom.totalNights} night{selectedRoom.totalNights !== 1 ? "s" : ""}
              </span>
              <span className="text-foreground">{toUsd(selectedRoom.totalPrice)}</span>
            </div>
          )}
          {selectedAddOns.map((a) => (
            <div key={a.id} className="flex justify-between">
              <span className="text-muted-foreground">{a.name}</span>
              <span className="text-foreground">{toUsd(a.price_ghs * a.quantity)}</span>
            </div>
          ))}
          {appliedPromo && (
            <div className="rounded-md border border-emerald-300/60 dark:border-emerald-700/60 border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <BadgePercent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Promo applied
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-semibold tracking-wide">
                      {appliedPromo.code}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {appliedPromo.discountType === "percentage"
                      ? `${appliedPromo.discountValue}% off`
                      : appliedPromo.discountType === "flat_rate"
                      ? `Group flat rate — ${toUsd(appliedPromo.discountValue)} × ${selectedRoom.totalNights} night${selectedRoom.totalNights === 1 ? "" : "s"} = ${toUsd(appliedPromo.discountValue * selectedRoom.totalNights)} (${toGhs(appliedPromo.discountValue * selectedRoom.totalNights)})`
                      : "Flat discount"}
                  </p>

                  {appliedPromo.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{appliedPromo.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {appliedPromo.discountGhs < 0 ? "+ " : "− "}
                    {toUsd(Math.abs(appliedPromo.discountGhs))}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {appliedPromo.discountGhs < 0 ? "Adjustment · " : ""}
                    {toGhs(Math.abs(appliedPromo.discountGhs))}
                  </div>
                </div>

              </div>
            </div>
          )}
          {!appliedPromo && promoError && (
            <Alert variant="destructive" className="py-2 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{promoError}</AlertDescription>
            </Alert>
          )}
          <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
            <span className="text-foreground">Total Due</span>
            <span className="text-accent">
              {toUsd(totalAmount)}
              <span className="block text-xs font-normal text-muted-foreground">{toGhs(totalAmount)}</span>
            </span>
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
