import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, Users, ChevronDown, Minus, Plus, Tag, Sparkles } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BookingSearch } from "@/hooks/useBooking";

interface Props {
  search: BookingSearch;
  onUpdate: (s: Partial<BookingSearch>) => void;
  onNext: () => void;
}

export default function SearchStep({ search, onUpdate, onNext }: Props) {
  const [showPromo, setShowPromo] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  const today = new Date();
  const checkIn = search.checkIn ?? today;
  const checkOut = search.checkOut ?? addDays(today, 1);
  const nights = search.checkIn && search.checkOut ? differenceInDays(search.checkOut, search.checkIn) : 1;

  const canProceed = search.checkIn && search.checkOut && nights > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto"
    >
      {/* Hero text */}
      <div className="text-center mb-10">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-accent mb-3">
          Book Direct & Save 12%
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-foreground">
          Plan Your Stay
        </h2>
        <p className="mt-3 font-sans text-muted-foreground text-sm max-w-md mx-auto">
          Best Rate Guarantee when you book directly with us
        </p>
      </div>

      {/* Booking bar */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8 space-y-6">
        {/* Dates row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Check-in */}
          <div className="space-y-2">
            <label className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Check-in
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !search.checkIn && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                  {search.checkIn ? format(search.checkIn, "EEE, MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={search.checkIn}
                  onSelect={(d) => {
                    onUpdate({ checkIn: d });
                    if (d && (!search.checkOut || d >= search.checkOut)) {
                      onUpdate({ checkOut: addDays(d, 1) });
                    }
                  }}
                  disabled={(d) => d < today}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out */}
          <div className="space-y-2">
            <label className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Check-out
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !search.checkOut && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                  {search.checkOut ? format(search.checkOut, "EEE, MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={search.checkOut}
                  onSelect={(d) => onUpdate({ checkOut: d })}
                  disabled={(d) => d <= (search.checkIn ?? today)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Guests */}
        <div className="space-y-2">
          <label className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Guests
          </label>
          <Popover open={guestOpen} onOpenChange={setGuestOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-12 font-normal">
                <span className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-accent" />
                  {search.adults} Adult{search.adults !== 1 ? "s" : ""}
                  {search.children > 0 && `, ${search.children} Child${search.children !== 1 ? "ren" : ""}`}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="start">
              <div className="space-y-4">
                <GuestCounter
                  label="Adults"
                  value={search.adults}
                  min={1}
                  max={6}
                  onChange={(v) => onUpdate({ adults: v })}
                />
                <GuestCounter
                  label="Children"
                  value={search.children}
                  min={0}
                  max={4}
                  onChange={(v) => onUpdate({ children: v })}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Promo code toggle */}
        <div>
          <button
            onClick={() => setShowPromo(!showPromo)}
            className="flex items-center gap-2 text-sm font-sans text-accent hover:text-accent/80 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            {showPromo ? "Hide promo code" : "Have a promo code?"}
          </button>
          <AnimatePresence>
            {showPromo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Input
                  value={search.promoCode}
                  onChange={(e) => onUpdate({ promoCode: e.target.value.toUpperCase() })}
                  placeholder="Enter promo code"
                  className="mt-3 h-12 uppercase tracking-wider"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nights summary & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="font-sans text-sm text-muted-foreground">
            {canProceed && (
              <span>
                <strong className="text-foreground">{nights}</strong> night{nights !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-sans text-sm font-semibold uppercase tracking-wider"
          >
            Check Availability
          </Button>
        </div>
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs font-sans text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Best Rate Guarantee
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Secure Payment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Free Cancellation Available
        </span>
      </div>
    </motion.div>
  );
}

function GuestCounter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-accent hover:text-accent disabled:opacity-30 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-6 text-center font-sans font-medium text-foreground">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-accent hover:text-accent disabled:opacity-30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
