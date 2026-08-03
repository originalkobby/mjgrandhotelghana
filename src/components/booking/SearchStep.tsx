import { useState } from "react";
import { motion } from "framer-motion";
import { format, addDays, differenceInDays } from "date-fns";
import type { BookingSearch } from "@/hooks/useBooking";

interface Props {
  search: BookingSearch;
  onUpdate: (patch: Partial<BookingSearch>) => void;
  onNext: () => void;
}

const toInput = (d: Date | undefined) => (d ? format(d, "yyyy-MM-dd") : "");

const SearchStep = ({ search, onUpdate, onNext }: Props) => {
  const [error, setError] = useState<string | null>(null);

  const nights =
    search.checkIn && search.checkOut ? differenceInDays(search.checkOut, search.checkIn) : 0;

  const handleContinue = () => {
    if (!search.checkIn || !search.checkOut) return setError("Please select check-in and check-out dates.");
    if (nights <= 0) return setError("Check-out must be after check-in.");
    setError(null);
    onNext();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <h2 className="font-serif text-2xl text-foreground">When would you like to stay?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Select your dates and party size to see available rooms.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Check-in</span>
          <input
            type="date"
            value={toInput(search.checkIn)}
            min={toInput(new Date())}
            onChange={(e) => onUpdate({ checkIn: e.target.value ? new Date(e.target.value) : undefined })}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Check-out</span>
          <input
            type="date"
            value={toInput(search.checkOut)}
            min={toInput(search.checkIn ? addDays(search.checkIn, 1) : addDays(new Date(), 1))}
            onChange={(e) => onUpdate({ checkOut: e.target.value ? new Date(e.target.value) : undefined })}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Adults</span>
          <input
            type="number"
            min={1}
            max={10}
            value={search.adults}
            onChange={(e) => onUpdate({ adults: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Children</span>
          <input
            type="number"
            min={0}
            max={10}
            value={search.children}
            onChange={(e) => onUpdate({ children: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Promo code (optional)</span>
          <input
            type="text"
            value={search.promoCode}
            onChange={(e) => onUpdate({ promoCode: e.target.value.toUpperCase() })}
            placeholder="e.g. MJGRAND10"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>

      {nights > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {nights} night{nights === 1 ? "" : "s"} selected
        </p>
      )}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={handleContinue}
        className="mt-6 w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
      >
        Search availability
      </button>
    </motion.section>
  );
};

export default SearchStep;
