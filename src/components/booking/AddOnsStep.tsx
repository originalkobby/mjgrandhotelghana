import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { SelectedAddOn, SelectedRoom } from "@/hooks/useBooking";

interface Props {
  selectedRoom: SelectedRoom;
  selectedAddOns: SelectedAddOn[];
  onToggle: (addOn: SelectedAddOn) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddOnsStep = ({ selectedRoom, selectedAddOns, onToggle, onNext, onBack }: Props) => {
  const addOns = useQuery(api.rooms.listActiveAddOns, {}) as any[] | undefined;
  const isSelected = (id: string) => selectedAddOns.some((a) => a.id === id);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="mx-auto max-w-3xl"
    >
      <h2 className="font-serif text-2xl text-foreground">Enhance your stay</h2>
      <p className="mt-1 text-sm text-muted-foreground">Optional extras for your {selectedRoom.name}.</p>

      {!addOns && <p className="mt-8 text-sm text-muted-foreground">Loading extras…</p>}

      <div className="mt-6 space-y-3">
        {(addOns ?? []).map((a: any) => {
          const active = isSelected(a._id);
          return (
            <button
              key={a._id}
              type="button"
              onClick={() =>
                onToggle({
                  id: a._id,
                  name: a.name ?? "",
                  price_ghs: a.price_ghs ?? 0,
                  icon: a.icon ?? "",
                  quantity: 1,
                })
              }
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span>
                <span className="block text-sm font-medium text-foreground">{a.name}</span>
                <span className="block text-xs text-muted-foreground">{a.description}</span>
              </span>
              <span className="ml-4 shrink-0 text-sm text-foreground">
                GH₵{(a.price_ghs ?? 0).toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="ml-auto rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Continue to guest details
        </button>
      </div>
    </motion.section>
  );
};

export default AddOnsStep;
