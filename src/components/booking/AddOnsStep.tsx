import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Car, UtensilsCrossed, Heart, Clock, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedAddOn, SelectedRoom } from "@/hooks/useBooking";

const ICON_MAP: Record<string, React.ElementType> = {
  car: Car,
  utensils: UtensilsCrossed,
  heart: Heart,
  clock: Clock,
  sparkles: Sparkles,
};

interface AddOnData {
  id: string;
  name: string;
  description: string;
  price_ghs: number;
  icon: string;
  category: string;
}

interface Props {
  selectedRoom: SelectedRoom;
  selectedAddOns: SelectedAddOn[];
  onToggle: (addOn: Omit<SelectedAddOn, "quantity">) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AddOnsStep({ selectedRoom, selectedAddOns, onToggle, onNext, onBack }: Props) {
  const [addOns, setAddOns] = useState<AddOnData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("add_ons")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setAddOns((data as AddOnData[]) ?? []);
        setLoading(false);
      });
  }, []);

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price_ghs, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to rooms
      </button>
      <h2 className="font-serif text-2xl md:text-3xl text-foreground">Enhance Your Stay</h2>
      <p className="font-sans text-sm text-muted-foreground mt-1 mb-8">
        Add extras to make your experience unforgettable
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addOns.map((addOn, index) => {
            const isSelected = selectedAddOns.some((a) => a.id === addOn.id);
            const Icon = ICON_MAP[addOn.icon] ?? Sparkles;

            return (
              <motion.button
                key={addOn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  onToggle({ id: addOn.id, name: addOn.name, price_ghs: addOn.price_ghs, icon: addOn.icon })
                }
                className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-accent-foreground" />
                  </span>
                )}
                <Icon className={`w-6 h-6 mb-3 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                <h4 className="font-sans text-sm font-semibold text-foreground">{addOn.name}</h4>
                <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-2">{addOn.description}</p>
                <p className="font-sans text-sm font-semibold text-accent mt-3">
                  GH₵ {addOn.price_ghs.toLocaleString()}
                </p>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <div className="font-sans text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Room:</span> GH₵{" "}
          {selectedRoom.totalPrice.toLocaleString()}
          {addOnsTotal > 0 && (
            <>
              {" "}+ <span className="text-accent font-medium">Extras:</span> GH₵ {addOnsTotal.toLocaleString()}
            </>
          )}
        </div>
        <Button
          onClick={onNext}
          className="h-11 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-sans text-sm font-semibold uppercase tracking-wider"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
