import { useState } from "react";
import { motion } from "framer-motion";
import type { GuestInfo, SelectedAddOn, SelectedRoom } from "@/hooks/useBooking";

interface Props {
  guestInfo: GuestInfo;
  selectedRoom: SelectedRoom;
  selectedAddOns: SelectedAddOn[];
  totalAmount: number;
  onUpdate: (patch: Partial<GuestInfo>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const GuestDetailsStep = ({
  guestInfo,
  selectedRoom,
  selectedAddOns,
  totalAmount,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}: Props) => {
  const [error, setError] = useState<string | null>(null);

  const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);
  const total = totalAmount || selectedRoom.totalPrice + addOnsTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInfo.fullName.trim() || !guestInfo.email.trim() || !guestInfo.phone.trim()) {
      return setError("Full name, email and phone are required.");
    }
    setError(null);
    onSubmit();
  };

  const field = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground";
  const labelCls = "text-xs uppercase tracking-wider text-muted-foreground";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="grid gap-8 lg:grid-cols-[1fr_320px]"
    >
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-2xl text-foreground">Guest details</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelCls}>Full name *</span>
            <input className={field} value={guestInfo.fullName} onChange={(e) => onUpdate({ fullName: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelCls}>Email *</span>
            <input type="email" className={field} value={guestInfo.email} onChange={(e) => onUpdate({ email: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelCls}>Phone *</span>
            <input className={field} value={guestInfo.phone} onChange={(e) => onUpdate({ phone: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelCls}>Nationality</span>
            <input className={field} value={guestInfo.nationality} onChange={(e) => onUpdate({ nationality: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelCls}>Estimated arrival time</span>
            <input type="time" className={field} value={guestInfo.arrivalTime} onChange={(e) => onUpdate({ arrivalTime: e.target.value })} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>Flight itinerary (optional)</span>
            <input className={field} value={guestInfo.flightItinerary} onChange={(e) => onUpdate({ flightItinerary: e.target.value })} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>Special requests</span>
            <textarea rows={3} className={field} value={guestInfo.specialRequests} onChange={(e) => onUpdate({ specialRequests: e.target.value })} />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-8 flex items-center gap-4">
          <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Creating booking…" : "Confirm booking"}
          </button>
        </div>
      </form>

      <aside className="h-fit rounded-2xl border border-border bg-card p-6">
        <h3 className="font-serif text-lg text-foreground">Booking Summary</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{selectedRoom.name}</dt>
            <dd className="text-foreground">GH₵{selectedRoom.totalPrice.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {selectedRoom.totalNights} night{selectedRoom.totalNights === 1 ? "" : "s"} @ GH₵
              {selectedRoom.nightlyRate.toLocaleString()}
            </dt>
            <dd />
          </div>
          {selectedAddOns.map((a) => (
            <div key={a.id} className="flex justify-between">
              <dt className="text-muted-foreground">
                {a.name}
                {a.quantity > 1 ? ` ×${a.quantity}` : ""}
              </dt>
              <dd className="text-foreground">GH₵{(a.price_ghs * a.quantity).toLocaleString()}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="text-foreground">Total</dt>
            <dd className="font-medium text-foreground">GH₵{total.toLocaleString()}</dd>
          </div>
        </dl>
      </aside>
    </motion.section>
  );
};

export default GuestDetailsStep;
