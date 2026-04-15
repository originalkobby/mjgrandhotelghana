import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import galleryPool from "@/assets/gallery-pool.jpg";
import galleryLobby from "@/assets/gallery-lobby.jpg";
import galleryGarden from "@/assets/gallery-garden.jpg";
import galleryBeach from "@/assets/gallery-beach.jpg";

const galleryImages = [
  { src: galleryPool, alt: "Hotel lounge with leather seating", size: "tall" },
  { src: galleryBeach, alt: "Head chef preparing fresh ingredients in the hotel kitchen", size: "wide" },
  { src: galleryGarden, alt: "MJ Pool Bar", size: "normal" },
  { src: galleryLobby, alt: "Poolside cabana and sun loungers", size: "wide" },
  { src: galleryPool, alt: "Hotel lounge — evening ambiance", size: "normal" },
  { src: galleryBeach, alt: "Culinary excellence at MJ Grand", size: "tall" },
  { src: galleryGarden, alt: "Garden terrace view", size: "normal" },
  { src: galleryLobby, alt: "Lobby interior design", size: "normal" },
];

const sizeClasses: Record<string, string> = {
  normal: "col-span-1 row-span-1",
  wide: "md:col-span-2 row-span-1",
  tall: "col-span-1 md:row-span-2",
};

const GalleryPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
            className="mb-6"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-sans text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.3, 0, 0.2, 1] }}
            className="text-center mb-16"
          >
            <p className="font-sans text-sm uppercase tracking-[0.25em] text-accent mb-3">
              Visual Story
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground">
              Our Gallery
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-[280px]">
            {galleryImages.map((img, i) => (
              <motion.div
                key={`${img.alt}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.15 + i * 0.08,
                  ease: [0.3, 0, 0.2, 1],
                }}
                className={`overflow-hidden ${sizeClasses[img.size]}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] hover:scale-105 cursor-pointer"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GalleryPage;
