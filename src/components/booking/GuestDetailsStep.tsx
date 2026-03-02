import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GuestInfo, SelectedRoom, SelectedAddOn } from "@/hooks/useBooking";

interface Props {
  guestInfo: GuestInfo;
  selectedRoom: SelectedRoom;
  selectedAddOns: SelectedAddOn[];
  totalAmount: number;
  onUpdate: (info: Partial<GuestInfo>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function GuestDetailsStep({
  guestInfo,
  selectedRoom,
  selectedAddOns,
  totalAmount,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}: Props) {
  const isValid =
    guestInfo.fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email) &&
    guestInfo.phone.trim().length >= 8;

  const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to extras
      </button>
      <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8">Guest Details</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Form */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <Input
                value={guestInfo.fullName}
                onChange={(e) => onUpdate({ fullName: e.target.value })}
                placeholder="John Doe"
                className="h-12"
              />
            </Field>
            <Field label="Email *">
              <Input
                type="email"
                value={guestInfo.email}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="john@example.com"
                className="h-12"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone *">
              <Input
                value={guestInfo.phone}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+233 xxx xxx xxxx"
                className="h-12"
              />
            </Field>
            <Field label="Nationality">
              <Input
                value={guestInfo.nationality}
                onChange={(e) => onUpdate({ nationality: e.target.value })}
                placeholder="e.g. Ghanaian"
                className="h-12"
              />
            </Field>
          </div>
          <Field label="Estimated Arrival Time">
            <Input
              value={guestInfo.arrivalTime}
              onChange={(e) => onUpdate({ arrivalTime: e.target.value })}
              placeholder="e.g. 3:00 PM"
              className="h-12"
            />
          </Field>
          <Field label="Special Requests">
            <Textarea
              value={guestInfo.specialRequests}
              onChange={(e) => onUpdate({ specialRequests: e.target.value })}
              placeholder="Any special requests for your stay..."
              className="min-h-[80px] resize-none"
            />
          </Field>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
            <span className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
              <Lock className="w-3.5 h-3.5" /> SSL Secured
            </span>
            <span className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
              <Shield className="w-3.5 h-3.5" /> Data Privacy Protected
            </span>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-24">
          <h3 className="font-serif text-lg text-foreground mb-4">Booking Summary</h3>

          <div className="space-y-3 text-sm font-sans">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{selectedRoom.name}</span>
              <span className="text-foreground font-medium">
                GH₵ {selectedRoom.nightlyRate.toLocaleString()} × {selectedRoom.totalNights}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room subtotal</span>
              <span className="text-foreground">GH₵ {selectedRoom.totalPrice.toLocaleString()}</span>
            </div>

            {selectedAddOns.length > 0 && (
              <>
                <div className="border-t border-border pt-3 mt-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Extras</p>
                  {selectedAddOns.map((a) => (
                    <div key={a.id} className="flex justify-between py-0.5">
                      <span className="text-muted-foreground">{a.name}</span>
                      <span className="text-foreground">GH₵ {a.price_ghs.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="border-t border-border pt-3 mt-3 flex justify-between font-semibold text-base">
              <span className="text-foreground">Total</span>
              <span className="text-accent">GH₵ {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <Button
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full mt-6 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-sans text-sm font-semibold uppercase tracking-wider"
          >
            {isSubmitting ? "Processing..." : "Confirm Booking"}
          </Button>

          <p className="text-center text-xs font-sans text-muted-foreground mt-3">
            You will not be charged until confirmation.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
