import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Coffee,
  Wifi,
  Waves,
  Car,
  ConciergeBell,
  WashingMachine,
  CupSoda,
  Users,
  Phone,
  ChevronDown,
  QrCode,
  Clock,
  Droplets,
  Dumbbell,
  UtensilsCrossed,
  PartyPopper,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImg from "@/assets/guest-services-hero.jpg";
import roomImg from "@/assets/room-suite.jpg";

const ease = [0.3, 0, 0.2, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease },
  }),
};

const services = [
  {
    icon: Coffee,
    title: "Complimentary Breakfast",
    text: "Served daily from 6:00 AM – 10:00 AM.\nBreakfast on arrival day attracts a charge.",
  },
  {
    icon: Wifi,
    title: "Free High-Speed WiFi",
    text: "Enjoy complimentary internet connection throughout the hotel.",
  },
  {
    icon: Waves,
    title: "Swimming Pool",
    text: "Guests enjoy complimentary access to our swimming pool facilities.",
  },
  {
    icon: Car,
    title: "Airport Shuttle",
    text: "Complimentary airport shuttle departs every 2 hours.\nOperating hours: 5:00 AM – 11:00 PM.\nPlease confirm arrangements with the Front Office in advance.",
  },
  {
    icon: ConciergeBell,
    title: "Room Service",
    text: "Room service available. Bible / Quran available on request.",
  },
  {
    icon: WashingMachine,
    title: "Laundry Service",
    text: "Laundry service attracts a charge.",
  },
  {
    icon: CupSoda,
    title: "Tea & Coffee Facility",
    text: "Complimentary tea and coffee facility available in rooms.",
  },
  {
    icon: Users,
    title: "Conference Facility",
    text: "Conference facility available for residential and corporate events.",
  },
  {
    icon: Dumbbell,
    title: "Gym",
    text: "A fully equipped gym facility for guests who wish to maintain their fitness and wellness routines during their stay.",
  },
  {
    icon: UtensilsCrossed,
    title: "Catering Services",
    text: "Professional catering services available for the general public, offering high-quality meals for a variety of occasions and gatherings.",
  },
  {
    icon: PartyPopper,
    title: "Outdoor Events",
    text: "We host outdoor events such as wedding receptions and end-of-year get-togethers, with dedicated event planning and execution.",
  },
];

const directory = [
  { dept: "Front Office", ext: "100 / 200 / 300" },
  { dept: "Ankomah Restaurant", ext: "112" },
  { dept: "Pool Bar", ext: "113" },
  { dept: "Kitchen", ext: "114" },
];

export default function GuestServices() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <img
            src={heroImg}
            alt="MJ Grand Hotel luxury lobby"
            className="h-[120%] w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/70" />
        </motion.div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold text-cream leading-tight max-w-4xl"
          >
            Guest Services & Information
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease }}
            className="mt-6 max-w-xl font-sans text-lg md:text-xl text-cream/80 leading-relaxed"
          >
            Everything you need for a comfortable stay at MJ Grand Hotel
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-sans text-xs uppercase tracking-widest text-cream/40">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-cream/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2 — INTRO */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease }}
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground"
          >
            Services for Our Royal Guests
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="mt-4 max-w-2xl mx-auto font-sans text-base md:text-lg text-muted-foreground leading-relaxed"
          >
            We are pleased to offer a range of services designed to make your stay comfortable and memorable.
          </motion.p>
        </div>
      </section>

      {/* SECTION 3 — SERVICES GRID */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="group bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-5 group-hover:bg-gold/10 transition-colors duration-300">
                  <s.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">{s.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {s.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — GUEST POLICY */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease }}
            >
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                Guest Information
              </h2>
              <div className="space-y-4 font-sans text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                  <p>
                    <strong className="text-foreground">Check-Out Time is 12:00 Noon.</strong><br />
                    Late check-out attracts a charge.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Droplets className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                  <p>
                    Complimentary bottled water is provided on arrival day.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1, ease }}
              className="overflow-hidden rounded-2xl"
            >
              <img
                src={roomImg}
                alt="MJ Grand Hotel suite"
                className="w-full h-80 lg:h-96 object-cover"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — IN-HOUSE DIRECTORY */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease }}
            className="font-serif text-3xl md:text-4xl text-foreground"
          >
            In-House Directory
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="mt-3 font-sans text-muted-foreground"
          >
            Use the following internal extensions to contact hotel departments.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
            className="mt-10 max-w-[800px] mx-auto bg-card rounded-[20px] border border-border shadow-sm p-8 md:p-10"
          >
            <div className="divide-y divide-border">
              {directory.map((d, i) => (
                <motion.div
                  key={d.dept}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="group flex items-center justify-between py-4 px-2 hover:bg-muted/30 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors duration-200" />
                    <span className="font-sans text-sm text-foreground font-medium">{d.dept}</span>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">{d.ext}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 6 — QR ACCESS */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease }}
            className="max-w-md mx-auto"
          >
            <QrCode className="w-10 h-10 text-gold mx-auto mb-4" />
            <h3 className="font-serif text-2xl text-foreground mb-2">Quick Access</h3>
            <p className="font-sans text-sm text-muted-foreground">
              Scan the QR code to access guest services information anytime.
            </p>
            <div className="mt-6 inline-block bg-card border border-border rounded-xl p-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://mjgrandhotel.com/guest-services&format=svg`}
                alt="QR code for MJ Grand Hotel Guest Services"
                className="w-40 h-40"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}