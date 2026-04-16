import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import galleryPool from "@/assets/gallery-pool.jpg";
import galleryLobby from "@/assets/gallery-lobby.jpg";
import galleryGarden from "@/assets/gallery-garden.jpg";
import galleryBeach from "@/assets/gallery-beach.jpg";

const fallbackImages = [
  { image_url: galleryPool, alt_text: "Hotel lounge with leather seating", span: "md:col-span-2" },
  { image_url: galleryBeach, alt_text: "Head chef preparing fresh ingredients", span: "" },
  { image_url: galleryGarden, alt_text: "MJ Pool Bar", span: "" },
  { image_url: galleryLobby, alt_text: "Poolside cabana and sun loungers", span: "md:col-span-2" },
];

const sizeToSpan: Record<string, string> = {
  normal: "",
  wide: "md:col-span-2",
  tall: "md:col-span-2",
};

const Gallery = () => {
  const { data: dbImages } = useQuery({
    queryKey: ["public-gallery-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const dbMapped = dbImages && dbImages.length > 0
    ? dbImages.map((img) => ({
        image_url: img.image_url,
        alt_text: img.alt_text,
        span: sizeToSpan[img.size] || "",
      }))
    : [];

  const images = [...fallbackImages, ...dbMapped].slice(0, 4);

  // Collect the image URLs used in the other 3 static cards (indices 0, 1, 3)
  const staticUrls = [images[0]?.image_url, images[1]?.image_url, images[3]?.image_url].filter(Boolean);

  return (
    <section id="gallery" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <p className="font-sans text-sm uppercase tracking-[0.25em] text-accent mb-3">
            Visual Story
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            Gallery
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {images.map((img, i) =>
            i === 2 ? (
              <SlideshowCard
                key="slideshow"
                fallbackImg={img}
                excludeUrls={staticUrls}
                index={i}
              />
            ) : (
              <GalleryImage key={`${img.alt_text}-${i}`} img={img} index={i} />
            )
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mt-12"
        >
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 font-sans text-sm uppercase tracking-[0.2em] text-accent hover:text-accent/80 transition-colors border-b border-accent/40 pb-1"
          >
            View More
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

/* ── Static card ── */
const GalleryImage = ({ img, index }: { img: { image_url: string; alt_text: string; span: string }; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay: index * 0.1, ease: [0.3, 0, 0.2, 1] }}
    className={`overflow-hidden ${img.span}`}
  >
    <img
      src={img.image_url}
      alt={img.alt_text}
      className="w-full h-64 md:h-80 object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] hover:scale-105 cursor-pointer"
      loading="lazy"
    />
  </motion.div>
);

/* ── Slideshow card (3rd position) ── */
const SlideshowCard = ({
  fallbackImg,
  excludeUrls,
  index,
}: {
  fallbackImg: { image_url: string; alt_text: string; span: string };
  excludeUrls: string[];
  index: number;
}) => {
  const { data: allDbImages } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Build pool excluding images shown in the other 3 cards
  const pool = (allDbImages || []).filter(
    (img) => !excludeUrls.includes(img.image_url)
  );

  const seenRef = useRef<Set<string>>(new Set());
  const [currentImg, setCurrentImg] = useState<{ url: string; alt: string }>({
    url: fallbackImg.image_url,
    alt: fallbackImg.alt_text,
  });

  const pickNext = useCallback(() => {
    if (pool.length === 0) return;

    let unseen = pool.filter((img) => !seenRef.current.has(img.id));
    if (unseen.length === 0) {
      seenRef.current = new Set();
      unseen = pool;
    }

    const next = unseen[Math.floor(Math.random() * unseen.length)];
    seenRef.current.add(next.id);
    setCurrentImg({ url: next.image_url, alt: next.alt_text });
  }, [pool]);

  useEffect(() => {
    if (pool.length === 0) return;
    // Show first DB image immediately
    pickNext();
    const id = setInterval(pickNext, 6000);
    return () => clearInterval(id);
    // Re-run when pool changes (new images added)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.3, 0, 0.2, 1] }}
      className={`overflow-hidden relative ${fallbackImg.span}`}
    >
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentImg.url}
          src={currentImg.url}
          alt={currentImg.alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.3, 0, 0.2, 1] }}
          className="w-full h-64 md:h-80 object-cover cursor-pointer absolute inset-0"
          loading="lazy"
        />
      </AnimatePresence>
      {/* Spacer to maintain height */}
      <div className="w-full h-64 md:h-80" />
    </motion.div>
  );
};

export default Gallery;
