import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Car, UtensilsCrossed, Heart, Clock, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedAddOn, SelectedRoom } from "@/hooks/useBooking";
import { useCurrency } from "@/contexts/CurrencyContext";

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

// Spa price list (GH₵). Prices are stored in GHS to match the add_ons table convention.
const SPA_TREATMENTS: { name: string; prices: { duration: number; price_ghs: number }[] }[] = [
  { name: "Neck and Shoulder", prices: [{ duration: 45, price_ghs: 450 }, { duration: 60, price_ghs: 670 }, { duration: 90, price_ghs: 900 }] },
  { name: "Swedish Massage", prices: [{ duration: 45, price_ghs: 450 }, { duration: 60, price_ghs: 670 }, { duration: 90, price_ghs: 900 }] },
  { name: "Deep Tissue", prices: [{ duration: 45, price_ghs: 450 }, { duration: 60, price_ghs: 670 }, { duration: 90, price_ghs: 900 }] },
  { name: "Thailand Oil", prices: [{ duration: 45, price_ghs: 480 }, { duration: 60, price_ghs: 720 }, { duration: 90, price_ghs: 950 }] },
  { name: "Thailand Traditional", prices: [{ duration: 45, price_ghs: 480 }, { duration: 60, price_ghs: 720 }, { duration: 90, price_ghs: 950 }] },
  { name: "Sports Massage", prices: [{ duration: 45, price_ghs: 500 }, { duration: 60, price_ghs: 750 }, { duration: 90, price_ghs: 1000 }] },
  { name: "Body Scrub", prices: [{ duration: 45, price_ghs: 500 }, { duration: 60, price_ghs: 750 }, { duration: 90, price_ghs: 1000 }] },
  { name: "Hot Stones", prices: [{ duration: 45, price_ghs: 500 }, { duration: 60, price_ghs: 750 }, { duration: 90, price_ghs: 1000 }] },
  { name: "Hot Oil", prices: [{ duration: 45, price_ghs: 500 }, { duration: 60, price_ghs: 750 }, { duration: 90, price_ghs: 1000 }] },
  { name: "Reflexology", prices: [{ duration: 45, price_ghs: 500 }, { duration: 60, price_ghs: 750 }, { duration: 90, price_ghs: 1000 }] },
  { name: "Therapeutic Massage", prices: [{ duration: 45, price_ghs: 500 }, { duration: 60, price_ghs: 750 }, { duration: 90, price_ghs: 1000 }] },
  { name: "Aromatherapy", prices: [{ duration: 45, price_ghs: 500 }, { duration: 60, price_ghs: 750 }, { duration: 90, price_ghs: 1000 }] },
  { name: "Herbal Ball", prices: [{ duration: 45, price_ghs: 600 }, { duration: 60, price_ghs: 900 }, { duration: 90, price_ghs: 1200 }] },
  { name: "Lotion Massage", prices: [{ duration: 45, price_ghs: 500 }, { duration: 60, price_ghs: 750 }, { duration: 90, price_ghs: 1000 }] },
  { name: "Couple Massage", prices: [{ duration: 45, price_ghs: 800 }, { duration: 60, price_ghs: 1200 }, { duration: 90, price_ghs: 1600 }] },
  { name: "Combo Massage", prices: [{ duration: 45, price_ghs: 800 }, { duration: 60, price_ghs: 1200 }, { duration: 90, price_ghs: 1600 }] },
  { name: "Four Hands Massage", prices: [{ duration: 45, price_ghs: 800 }, { duration: 60, price_ghs: 1200 }, { duration: 90, price_ghs: 1600 }] },
];
const SPA_FLAT: { name: string; price_ghs: number }[] = [{ name: "Sauna", price_ghs: 250 }];
const SPA_MIN_PRICE = 250;

export default function AddOnsStep({ selectedRoom, selectedAddOns, onToggle, onNext, onBack }: Props) {
  const [addOns, setAddOns] = useState<AddOnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [spaChoice, setSpaChoice] = useState<{ label: string; priceUsd: number } | null>(null);
  const { toUsd, toGhs, rate } = useCurrency();

  const DYNAMIC_ADDONS = ["Early Check-in", "Late Checkout"];

  useEffect(() => {
    supabase
      .from("add_ons")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const items = ((data as AddOnData[]) ?? []).map((a) => {
          if (DYNAMIC_ADDONS.includes(a.name)) {
            return { ...a, price_ghs: selectedRoom.nightlyRate / 2 };
          }
          return a;
        });
        setAddOns(items);
        setLoading(false);
      });
  }, [selectedRoom.nightlyRate]);

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price_ghs, 0);

  const handleSpaChange = (value: string, addOn: AddOnData) => {
    if (!value) return;
    const [name, durationStr] = value.split("|");
    let price = 0;
    let label = "";
    if (durationStr === "flat") {
      const flat = SPA_FLAT.find((f) => f.name === name);
      if (!flat) return;
      price = flat.price_ghs;
      label = name;
    } else {
      const treatment = SPA_TREATMENTS.find((t) => t.name === name);
      const opt = treatment?.prices.find((p) => p.duration === Number(durationStr));
      if (!treatment || !opt) return;
      price = opt.price_ghs;
      label = `${name} – ${opt.duration} min`;
    }

    const newChoice = { label, price_ghs: price };
    setSpaChoice(newChoice);

    const isSelected = selectedAddOns.some((a) => a.id === addOn.id);
    const payload = { id: addOn.id, name: `Spa – ${label}`, price_ghs: price, icon: addOn.icon };
    if (isSelected) {
      // Re-toggle so total reflects the updated treatment price
      onToggle(payload); // remove existing
      onToggle(payload); // re-add with new price
    }
  };

  const handleSpaCardClick = (addOn: AddOnData) => {
    if (!spaChoice) return;
    onToggle({ id: addOn.id, name: `Spa – ${spaChoice.label}`, price_ghs: spaChoice.price_ghs, icon: addOn.icon });
  };

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
            const isSpa = addOn.name === "Spa Package";

            const cardClass = `relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? "border-accent bg-accent/5 shadow-sm"
                : "border-border bg-card hover:border-accent/40"
            }`;

            const displayPrice = isSpa ? (spaChoice?.price_ghs ?? SPA_MIN_PRICE) : addOn.price_ghs;
            const pricePrefix = isSpa && !spaChoice ? "From " : "";

            const cardInner = (
              <>
                {isSelected && (
                  <span className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-accent-foreground" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-5 h-5 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                  <h4 className="font-sans text-sm font-semibold text-foreground">{addOn.name}</h4>
                </div>
                <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-2">{addOn.description}</p>
                {isSpa && (
                  <select
                    value={
                      spaChoice
                        ? (() => {
                            // try to reconstruct value from label
                            if (SPA_FLAT.some((f) => f.name === spaChoice.label)) return `${spaChoice.label}|flat`;
                            const m = spaChoice.label.match(/^(.*) – (\d+) min$/);
                            return m ? `${m[1]}|${m[2]}` : "";
                          })()
                        : ""
                    }
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSpaChange(e.target.value, addOn);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 h-8 text-xs w-full rounded-md border border-border bg-background px-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                    aria-label="Choose spa treatment"
                  >
                    <option value="" disabled>
                      Choose treatment…
                    </option>
                    {SPA_TREATMENTS.map((t) => (
                      <optgroup key={t.name} label={t.name}>
                        {t.prices.map((p) => (
                          <option key={`${t.name}-${p.duration}`} value={`${t.name}|${p.duration}`}>
                            {t.name} – {p.duration} min · GH₵ {p.price_ghs}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <optgroup label="Other">
                      {SPA_FLAT.map((f) => (
                        <option key={f.name} value={`${f.name}|flat`}>
                          {f.name} · GH₵ {f.price_ghs}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                )}
                <p className="font-sans text-sm font-semibold text-accent mt-3">
                  {pricePrefix}
                  {toUsd(displayPrice)}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {pricePrefix}
                    {toGhs(displayPrice)}
                  </span>
                </p>
                {isSpa && !spaChoice && !isSelected && (
                  <p className="mt-1 text-[10px] text-muted-foreground italic">Pick a treatment to add</p>
                )}
              </>
            );

            if (isSpa) {
              return (
                <motion.div
                  key={addOn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSpaCardClick(addOn)}
                  className={`${cardClass} cursor-pointer`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSpaCardClick(addOn);
                    }
                  }}
                >
                  {cardInner}
                </motion.div>
              );
            }

            return (
              <motion.button
                key={addOn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  onToggle({ id: addOn.id, name: addOn.name, price_ghs: addOn.price_ghs, icon: addOn.icon })
                }
                className={cardClass}
              >
                {cardInner}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <div className="font-sans text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Room:</span> {toUsd(selectedRoom.totalPrice)}
          <span className="text-xs text-muted-foreground ml-1">({toGhs(selectedRoom.totalPrice)})</span>
          {addOnsTotal > 0 && (
            <>
              {" "}+ <span className="text-accent font-medium">Extras:</span> {toUsd(addOnsTotal)}
              <span className="text-xs text-muted-foreground ml-1">({toGhs(addOnsTotal)})</span>
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
