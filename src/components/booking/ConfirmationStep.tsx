import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { BookingState } from "@/hooks/useBooking";

interface Props {
  state: BookingState;
}

const ConfirmationStep = ({ state }: Props) => {
  const { selectedRoom, search, guestInfo, bookingReference, selectedAddOns } = state;
  const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);
  const total = state.totalAmount || (selectedRoom ? selectedRoom.totalPrice + addOnsTotal : 0);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center"
    >
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <h1 className="mt-4 font-serif text-3xl text-foreground">Your reservation is confirmed</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A confirmation has been sent to {guestInfo.email || "your email"}.
      </p>

      <div className="mt-8 rounded-xl border border-border p-5 text-left text-sm">
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Reference</span>
          <span className="font-medium text-foreground">{bookingReference ?? "--"}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Guest</span>
          <span className="text-foreground">{guestInfo.fullName}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Room</span>
          <span className="text-foreground">{selectedRoom?.name ?? "--"}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Check-in</span>
          <span className="text-foreground">{search.checkIn ? format(search.checkIn, "dd/MM/yyyy") : "--"}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Check-out</span>
          <span className="text-foreground">{search.checkOut ? format(search.checkOut, "dd/MM/yyyy") : "--"}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-3">
          <span className="text-foreground">Total</span>
          <span className="font-medium text-foreground">GH₵{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="rounded-lg border border-border px-5 py-2.5 text-sm text-foreground hover:bg-accent">
          Back to homepage
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Print confirmation
        </button>
      </div>
    </motion.section>
  );
};

export default ConfirmationStep;
