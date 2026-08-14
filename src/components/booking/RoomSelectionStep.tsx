import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Wifi, Wind, Coffee, Tv, BedDouble, Maximize, Users, ShieldCheck, Minus, Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";
import type { BookingSearch, GroupRoom, SelectedRoom } from "@/hooks/useBooking";
import { useCurrency } from "@/contexts/CurrencyContext";

import roomDeluxe from "@/assets/room-deluxe.jpg";
import roomSuite from "@/assets/room-suite.jpg";
import roomPenthouse from "@/assets/room-penthouse.jpg";

const IMAGE_MAP: Record<string, string> = {
  "/room-deluxe.jpg": roomDeluxe,
  "/room-suite.jpg": roomSuite,
  "/room-penthouse.jpg": roomPenthouse,
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  "Wi-Fi": Wifi,
  "Air Conditioning": Wind,
  "Mini Bar": Coffee,
  "Flat Screen TV": Tv,
};

const PUBLIC_ROOM_COLUMNS =
  "id, name, slug, description, size_sqm, bed_type, max_adults, max_children, base_price_ghs, amenities, images, sort_order, is_active, total_units";

interface RoomData {
  id: string;
  name: string;
  slug: string;
  description: string;
  size_sqm: number;
  bed_type: string;
  max_adults: number;
  max_children: number;
  base_price_ghs: number;
  amenities: string[];
  images: string[];
  available: boolean;
  availableCount: number;
  nightlyRate: number;
}

const MAX_GROUP_ROOMS = 20;

interface Props {
  search: BookingSearch;
  onSelect: (room: SelectedRoom) => void;
  onBack: () => void;
  isGroup?: boolean;
  onToggleGroup?: (value: boolean) => void;
  onGroupContinue?: (rooms: GroupRoom[]) => void;
}

export default function RoomSelectionStep({
  search,
  onSelect,
  onBack,
  isGroup = false,
  onToggleGroup,
  onGroupContinue,
}: Props) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "recommended">("recommended");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const nights = search.checkIn && search.checkOut
    ? differenceInDays(search.checkOut, search.checkIn)
    : 1;

  const fetchRooms = useCallback(async () => {
    if (!search.checkIn || !search.checkOut) return;
    const checkInStr = search.checkIn.toISOString().split("T")[0];
    const checkOutStr = search.checkOut.toISOString().split("T")[0];

    const { data: roomsData } = await supabase
      .from("rooms")
      .select(PUBLIC_ROOM_COLUMNS)
      .eq("is_active", true)
      .order("sort_order");

    if (!roomsData) {
      setLoading(false);
      return;
    }

    // Build the list of nights in the stay window.
    const nightsList: string[] = [];
    const cursor = new Date(search.checkIn);
    const end = new Date(search.checkOut);
    while (cursor < end) {
      nightsList.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    const roomResults: RoomData[] = [];
    for (const room of roomsData) {
      const { data: inventory } = await supabase
        .from("room_availability" as never)
        .select("date, total_count, booked_count, is_closed")
        .eq("room_id", room.id)
        .gte("date", checkInStr)
        .lt("date", checkOutStr) as { data: Array<{ date: string; total_count: number; booked_count: number; is_closed: boolean }> | null };

      const invByDate = new Map<string, typeof inventory[number]>();
      (inventory ?? []).forEach((row) => invByDate.set(row.date, row));

      let available = true;
      let minAvailable = room.total_units;

      // Evaluate every night — missing inventory rows fall back to rooms.total_units
      // with booked_count = 0, so availability still respects the configured cap.
      for (const dateStr of nightsList) {
        const inv = invByDate.get(dateStr);
        const totalForDate = inv?.total_count ?? room.total_units;
        const bookedForDate = inv?.booked_count ?? 0;
        const closed = inv?.is_closed ?? false;

        if (closed || bookedForDate >= totalForDate) {
          available = false;
          break;
        }
        const avail = totalForDate - bookedForDate;
        if (avail < minAvailable) minAvailable = avail;
      }

      // Pricing matches the homepage: always use the room's base price.
      const avgRate = room.base_price_ghs;

      roomResults.push({
        id: room.id,
        name: room.name,
        slug: room.slug,
        description: room.description ?? "",
        size_sqm: room.size_sqm ?? 0,
        bed_type: room.bed_type ?? "",
        max_adults: room.max_adults,
        max_children: room.max_children ?? 0,
        base_price_ghs: room.base_price_ghs,
        amenities: (room.amenities as string[]) ?? [],
        images: (room.images as string[]) ?? [],
        available,
        availableCount: available ? minAvailable : 0,
        nightlyRate: avgRate,
      });
    }

    if (sortBy === "price") {
      roomResults.sort((a, b) => a.nightlyRate - b.nightlyRate);
    }

    setRooms(roomResults);
    setLoading(false);
  }, [search.checkIn, search.checkOut, sortBy]);

  useEffect(() => {
    setLoading(true);
    fetchRooms();
  }, [fetchRooms]);

  // Note: realtime subscriptions are restricted to staff. Public booking page
  // refetches availability when the user changes dates or returns to this step.

  const toSelectedRoom = (room: RoomData): SelectedRoom => ({
    id: room.id,
    name: room.name,
    slug: room.slug,
    description: room.description,
    size_sqm: room.size_sqm,
    bed_type: room.bed_type,
    base_price_ghs: room.base_price_ghs,
    amenities: room.amenities,
    images: room.images,
    nightlyRate: room.nightlyRate,
    totalNights: nights,
    totalPrice: room.nightlyRate * nights,
  });

  const totalSelectedRooms = Object.values(quantities).reduce((a, b) => a + b, 0);
  const groupTotalPrice = rooms.reduce(
    (sum, r) => sum + (quantities[r.id] ?? 0) * r.nightlyRate * nights,
    0
  );

  const changeQuantity = (room: RoomData, delta: number) => {
    setQuantities((prev) => {
      const current = prev[room.id] ?? 0;
      const others = totalSelectedRooms - current;
      const max = Math.min(room.availableCount, MAX_GROUP_ROOMS - others);
      const next = Math.max(0, Math.min(max, current + delta));
      const updated = { ...prev, [room.id]: next };
      if (next === 0) delete updated[room.id];
      return updated;
    });
  };

  const handleGroupContinue = () => {
    if (!onGroupContinue) return;
    const selection: GroupRoom[] = rooms
      .filter((r) => (quantities[r.id] ?? 0) > 0)
      .map((r) => ({ ...toSelectedRoom(r), quantity: quantities[r.id] }));
    if (selection.length === 0) return;
    onGroupContinue(selection);
  };

  const handleSelect = (room: RoomData) => {
    onSelect({
      id: room.id,
      name: room.name,
      slug: room.slug,
      description: room.description,
      size_sqm: room.size_sqm,
      bed_type: room.bed_type,
      base_price_ghs: room.base_price_ghs,
      amenities: room.amenities,
      images: room.images,
      nightlyRate: room.nightlyRate,
      totalNights: nights,
      totalPrice: room.nightlyRate * nights,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Change dates
          </button>
          <h2 className="font-serif text-2xl md:text-3xl text-foreground">Select Your Room</h2>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            {nights} night{nights !== 1 ? "s" : ""} · {search.adults} adult{search.adults !== 1 ? "s" : ""}
            {search.children > 0 && ` · ${search.children} child${search.children !== 1 ? "ren" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          {onToggleGroup && (
            <Button
              variant={isGroup ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setQuantities({});
                onToggleGroup(!isGroup);
              }}
              className="text-xs gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              {isGroup ? "Group booking on" : "Group booking"}
            </Button>
          )}
          <Button
            variant={sortBy === "recommended" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recommended")}
            className="text-xs"
          >
            Recommended
          </Button>
          <Button
            variant={sortBy === "price" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("price")}
            className="text-xs"
          >
            Lowest Price
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              nights={nights}
              index={index}
              onSelect={() => handleSelect(room)}
              isGroup={isGroup}
              quantity={quantities[room.id] ?? 0}
              onQuantityChange={(delta) => changeQuantity(room, delta)}
            />
          ))}
        </div>
      )}

      {isGroup && !loading && (
        <div className="sticky bottom-4 mt-6 bg-card border border-border rounded-xl shadow-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-sans text-sm text-muted-foreground">
            {totalSelectedRooms === 0 ? (
              <>Choose how many of each room type you need (up to {MAX_GROUP_ROOMS} rooms).</>
            ) : (
              <>
                <span className="text-foreground font-semibold">
                  {totalSelectedRooms} room{totalSelectedRooms !== 1 ? "s" : ""}
                </span>{" "}
                · {nights} night{nights !== 1 ? "s" : ""} ·{" "}
                <GroupTotal amount={groupTotalPrice} />
              </>
            )}
          </div>
          <Button
            onClick={handleGroupContinue}
            disabled={totalSelectedRooms === 0}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans text-xs font-semibold uppercase tracking-wider"
          >
            Continue with {totalSelectedRooms || 0} room{totalSelectedRooms !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function GroupTotal({ amount }: { amount: number }) {
  const { toUsd, toGhs } = useCurrency();
  return (
    <span className="text-foreground font-semibold">
      {toUsd(amount)} <span className="text-muted-foreground font-normal">({toGhs(amount)})</span>
    </span>
  );
}

function RoomCard({
  room,
  nights,
  index,
  onSelect,
  isGroup,
  quantity,
  onQuantityChange,
}: {
  room: RoomData;
  nights: number;
  index: number;
  onSelect: () => void;
  isGroup: boolean;
  quantity: number;
  onQuantityChange: (delta: number) => void;
}) {
  const imgSrc = IMAGE_MAP[room.images[0]] ?? room.images[0];
  const { toUsd, toGhs } = useCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        !room.available ? "opacity-50" : ""
      }`}
    >
      <div className="flex flex-col">
        {/* Image */}
        <div className="relative h-60 md:h-60">
          <img
            src={imgSrc}
            alt={room.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {room.available && room.availableCount <= 3 && room.availableCount > 0 && (
            <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-sans font-medium px-2 py-0.5 rounded-full">
              Only {room.availableCount} left
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-3 md:p-4 flex flex-col flex-1">
          <h3 className="font-serif text-base text-foreground">{room.name}</h3>
          <p className="font-sans text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {room.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-sans text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Maximize className="w-3 h-3" /> {room.size_sqm} sqm
            </span>
            <span className="flex items-center gap-0.5">
              <BedDouble className="w-3 h-3" /> {room.bed_type}
            </span>
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" /> Up to {room.max_adults}
            </span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1 mt-2">
            {room.amenities.slice(0, 4).map((amenity) => {
              const Icon = AMENITY_ICONS[amenity];
              return (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-0.5 bg-secondary text-secondary-foreground text-[10px] font-sans px-1.5 py-0.5 rounded-full"
                >
                  {Icon && <Icon className="w-2.5 h-2.5" />}
                  {amenity}
                </span>
              );
            })}
            {room.amenities.length > 4 && (
              <span className="text-[10px] text-accent font-sans">
                +{room.amenities.length - 4} more
              </span>
            )}
          </div>

          {/* Cancellation */}
          <div className="flex items-center gap-1 mt-2 text-[10px] font-sans text-accent">
            <ShieldCheck className="w-3 h-3" />
            Free cancellation
          </div>

          {/* Price & CTA */}
          <div className="flex items-end justify-between mt-auto pt-3 border-t border-border">
            <div>
              <p className="font-sans text-[10px] text-muted-foreground">From</p>
              <p className="font-serif text-lg text-foreground leading-tight">
                {toUsd(room.nightlyRate)}
              </p>
              <p className="font-sans text-[10px] text-muted-foreground">{toGhs(room.nightlyRate)}/night</p>
            </div>
            {isGroup ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!room.available || quantity === 0}
                  onClick={() => onQuantityChange(-1)}
                  aria-label={`Remove one ${room.name}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="font-sans text-sm w-5 text-center tabular-nums">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!room.available || quantity >= room.availableCount}
                  onClick={() => onQuantityChange(1)}
                  aria-label={`Add one ${room.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={onSelect}
                disabled={!room.available}
                size="sm"
                className="h-8 px-3 bg-accent text-accent-foreground hover:bg-accent/90 font-sans text-xs font-semibold uppercase tracking-wider"
              >
                {room.available ? "Select" : "Unavailable"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
