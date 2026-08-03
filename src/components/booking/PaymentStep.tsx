import { useState } from "react";
import { motion } from "framer-motion";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { GuestInfo, SelectedAddOn, SelectedRoom } from "@/hooks/useBooking";
import { useToast } from "@/hooks/use-toast";

interface Props {
  selectedRoom: SelectedRoom;
  selectedAddOns: SelectedAddOn[];
  guestInfo: GuestInfo;
  totalAmount: number;
  bookingReference: string | null;
  onPaymentComplete: () => void;
  onBack: () => void;
}

const PaymentStep = ({
  selectedRoom,
  selectedAddOns,
  guestInfo,
  totalAmount,
  bookingReference,
  onPaymentComplete,
  onBack,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const initialize = useAction(api.paystack.initialize);
  const { toast } = useToast();

  const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);
  const total = totalAmount || selectedRoom.totalPrice + addOnsTotal;

  const payNow = async () => {
    if (!bookingReference) return;
    setLoading(true);
    try {
      const res = await initialize({
        email: guestInfo.email,
        bookingReference,
        callbackUrl: `${window.location.origin}/booking?verify=${bookingReference}`,
      });
      if (res?.authorization_url) {
        window.location.href = res.authorization_url;
        return;
      }
      throw new Error("Payment could not be initialised.");
    } catch (err: any) {
      toast({
        title: "Payment failed",
        description: err?.message ?? "Please try again or pay at the hotel.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <h2 className="font-serif text-2xl text-foreground">Payment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Reference <span className="text-foreground">{bookingReference ?? "--"}</span>
      </p>

      <div className="mt-6 rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">Booking Summary</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{selectedRoom.name}</dt>
            <dd className="text-foreground">GH₵{selectedRoom.totalPrice.toLocaleString()}</dd>
          </div>
          {selectedAddOns.map((a) => (
            <div key={a.id} className="flex justify-between">
              <dt className="text-muted-foreground">{a.name}</dt>
              <dd className="text-foreground">GH₵{(a.price_ghs * a.quantity).toLocaleString()}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="text-foreground">Amount due</dt>
            <dd className="font-medium text-foreground">GH₵{total.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={payNow}
          disabled={loading || !bookingReference}
          className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Redirecting to Paystack…" : "Pay securely with Paystack"}
        </button>
        <button
          type="button"
          onClick={onPaymentComplete}
          className="w-full rounded-lg border border-border px-6 py-3 text-sm text-foreground hover:bg-accent"
        >
          I'll pay on arrival
        </button>
      </div>

      <button type="button" onClick={onBack} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </button>
    </motion.section>
  );
};

export default PaymentStep;
