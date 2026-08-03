import { motion } from "framer-motion";
import { differenceInDays } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Users, BedDouble, Maximize } from "lucide-react";
import type { BookingSearch, SelectedRoom } from "@/hooks/useBooking";

interface Props {
  search: BookingSearch;
  onSelect: (room: SelectedRoom) => void;
  onBack: () => void;
}

const RoomSelectionStep = ({ search, onSelect, onBack }: Props) => {
  const rooms = useQuery(api.rooms.listActiveRooms, {}) as any[] | undefined;

  const nights =
    search.checkIn && search.checkOut ? Math.max(differenceInDays(search.checkOut, search.checkIn), 1) : 1;

  const handleSelect = (r: any) => {
    const rate = r.base_price_ghs ?? 0;
    onSelect({
      id: r._id,
      name: r.name ?? "",
      slug: r.slug ?? "",
      description: r.description ?? "",
      size_sqm: r.size_sqm ?? 0,
      bed_type: r.bed_type ?? "",
      base_price_ghs: rate,
      amenities: r.amenities ?? [],
      images: r.images ?? [],
      nightlyRate: rate,
      totalNights: nights,
      totalPrice: rate * nights,
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <h2 className="font-serif text-2xl text-foreground">Choose your room</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {nights} night{nights === 1 ? "" : "s"} · {search.adults} adult{search.adults === 1 ? "" : "s"}
        {search.children > 0 ? ` · ${search.children} children` : ""}
      </p>

      {!rooms && <p className="mt-8 text-sm text-muted-foreground">Loading rooms…</p>}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {(rooms ?? [])
          .slice()
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((r: any) => (
            <article key={r._id} className="overflow-hidden rounded-2xl border border-border bg-card">
              {r.images?.[0] && (
                <img src={r.images[0]} alt={r.name ?? "Room"} loading="lazy" className="h-48 w-full object-cover" />
              )}
              <div className="p-5">
                <h3 className="font-serif text-xl text-foreground">{r.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {r.bed_type && (
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" /> {r.bed_type}
                    </span>
                  )}
                  {r.size_sqm ? (
                    <span className="inline-flex items-center gap-1">
                      <Maximize className="h-3.5 w-3.5" /> {r.size_sqm} m²
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Up to {r.max_adults ?? 2}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-lg font-medium text-foreground">
                      GH₵{(r.base_price_ghs ?? 0).toLocaleString()}
                    </span>{" "}
                    / night
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Select
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>

      <button type="button" onClick={onBack} className="mt-8 text-sm text-muted-foreground hover:text-foreground">
        ← Back to dates
      </button>
    </motion.section>
  );
};

export default RoomSelectionStep;
