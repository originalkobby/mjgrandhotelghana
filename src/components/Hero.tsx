import { motion } from "framer-motion";
import heroImg from "@/assets/hero-hotel.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background image with slow zoom */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="MJ Grand Hotel exterior at golden hour"
          className="h-full w-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-overlay-heavy" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.3, 0, 0.2, 1] }}
          className="mb-4 font-sans text-sm uppercase tracking-[0.3em] text-gold"
        >
          A Sanctuary of Elegance
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.3, 0, 0.2, 1] }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium text-cream leading-tight max-w-4xl"
        >
          MJ Grand Hotel
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.3, 0, 0.2, 1] }}
          className="mt-6 max-w-xl font-sans text-base md:text-lg text-cream/70 leading-relaxed"
        >
          Where timeless luxury meets modern sophistication. Experience unparalleled hospitality in the heart of paradise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0, ease: [0.3, 0, 0.2, 1] }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <a
            href="#contact"
            className="group relative px-8 py-3.5 bg-gold font-sans text-sm font-semibold uppercase tracking-wider text-charcoal overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-gold/20"
          >
            <span className="relative z-10">Book Your Stay</span>
          </a>
          <motion.a
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.2, ease: [0.3, 0, 0.2, 1] }}
            href="#rooms"
            className="group px-8 py-3.5 border border-cream/30 font-sans text-sm font-medium uppercase tracking-wider text-cream hover:border-gold hover:text-gold transition-all duration-300"
          >
            View Rooms
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-sans text-xs uppercase tracking-widest text-cream/40">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-cream/40 to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default Hero;
