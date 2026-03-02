import { motion } from "framer-motion";
import roomSuite from "@/assets/room-suite.jpg";
import roomDeluxe from "@/assets/room-deluxe.jpg";
import roomPenthouse from "@/assets/room-penthouse.jpg";

const rooms = [
  {
    image: roomSuite,
    title: "Ocean Suite",
    description: "Panoramic ocean views with private balcony and luxurious amenities.",
    price: "From $450/night",
  },
  {
    image: roomDeluxe,
    title: "Deluxe Room",
    description: "Mediterranean charm meets modern comfort with terrace access.",
    price: "From $320/night",
  },
  {
    image: roomPenthouse,
    title: "Presidential Penthouse",
    description: "The pinnacle of luxury with panoramic city and ocean vistas.",
    price: "From $1,200/night",
  },
];

const RoomCard = ({ room, index }: { room: typeof rooms[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.3, 0, 0.2, 1] }}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden">
        <img
          src={room.image}
          alt={room.title}
          className="w-full aspect-[4/5] object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <span className="font-sans text-sm font-medium text-gold">{room.price}</span>
        </div>
      </div>
      <div className="mt-5">
        <h3 className="font-serif text-xl text-foreground group-hover:text-accent transition-colors duration-300">
          {room.title}
        </h3>
        <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">
          {room.description}
        </p>
        <a
          href="/booking"
          className="inline-block mt-4 font-sans text-sm font-medium text-accent hover:text-gold-dark transition-colors duration-300 underline underline-offset-4 decoration-accent/30 hover:decoration-accent"
        >
          Book Now
        </a>
      </div>
    </motion.div>
  );
};

const RoomsPreview = () => {
  return (
    <section id="rooms" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <p className="font-sans text-sm uppercase tracking-[0.25em] text-accent mb-3">
            Accommodations
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            Rooms & Suites
          </h2>
          <p className="mt-4 max-w-lg mx-auto font-sans text-muted-foreground">
            Each room is a masterful blend of comfort and elegance, designed for the discerning traveler.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {rooms.map((room, i) => (
            <RoomCard key={room.title} room={room} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoomsPreview;
