import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

import roomSuite from "@/assets/room-suite.jpg";
import roomDeluxe from "@/assets/room-deluxe.jpg";
import roomPenthouse from "@/assets/room-penthouse.jpg";

const FALLBACK_IMAGES: Record<string, string> = {
  "/room-deluxe.jpg": roomDeluxe,
  "/room-suite.jpg": roomSuite,
  "/room-penthouse.jpg": roomPenthouse,
};

interface RoomRow {
  id: string;
  name: string;
  description: string | null;
  base_price_ghs: number;
  images: string[] | null;
}

function resolveImage(images: string[] | null): string {
  const src = images?.[0];
  if (!src) return roomDeluxe;
  return FALLBACK_IMAGES[src] ?? src;
}

const ease: [number, number, number, number] = [0.3, 0, 0.2, 1];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};

const TRUNCATE_LENGTH = 80;

const RoomCard = ({ room, index }: { room: RoomRow; index: number }) => {
  const imgSrc = resolveImage(room.images);
  const { toUsd, toGhs } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  const description = room.description ?? "Experience luxury and comfort.";
  const needsTruncation = description.length > TRUNCATE_LENGTH;
  const displayText = !needsTruncation || expanded
    ? description
    : description.slice(0, TRUNCATE_LENGTH).trimEnd() + "…";

  return (
    <motion.div
      variants={fadeUp}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden">
        <img
          src={imgSrc}
          alt={room.name}
          className="w-full aspect-[4/5] object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <span className="font-sans text-sm font-medium text-gold">
            From {toUsd(room.base_price_ghs)}/night
          </span>
          <span className="block font-sans text-xs text-gold/70">
            {toGhs(room.base_price_ghs)}
          </span>
        </div>
      </div>
      <div className="mt-5">
        <h3 className="font-serif text-xl text-foreground group-hover:text-accent transition-colors duration-300">
          {room.name}
        </h3>
        <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">
          {displayText}
          {needsTruncation && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="ml-1 font-sans text-xs font-medium text-[hsl(217,91%,60%)] hover:text-[hsl(217,91%,50%)] transition-colors duration-200"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </p>
        <a
          href={`/booking?room=${room.id}`}
          className="inline-block mt-4 font-sans text-sm font-medium text-accent hover:text-gold-dark transition-colors duration-300 underline underline-offset-4 decoration-accent/30 hover:decoration-accent"
        >
          Book Now
        </a>
      </div>
    </motion.div>
  );
};

const RoomsPreview = () => {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["public-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, description, base_price_ghs, images")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as RoomRow[];
    },
    staleTime: 60_000,
  });

  return (
    <section id="rooms" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.p
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="font-sans text-sm uppercase tracking-[0.25em] text-accent mb-3"
          >
            Accommodations
          </motion.p>
          <motion.h2
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="font-serif text-4xl md:text-5xl text-foreground"
          >
            Rooms & Suites
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-4 max-w-lg mx-auto font-sans text-muted-foreground"
          >
            Each room is a masterful blend of comfort and elegance, designed for the discerning traveler.
          </motion.p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-[4/5] rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
          >
            {rooms?.map((room) => (
              <RoomCard key={room.id} room={room} index={0} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default RoomsPreview;
