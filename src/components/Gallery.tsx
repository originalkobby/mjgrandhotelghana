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
        <div className="text-center mb-16">
          <motion.p
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="font-sans text-sm uppercase tracking-[0.25em] text-accent mb-3"
          >
            Visual Story
          </motion.p>
          <motion.h2
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="font-serif text-4xl md:text-5xl text-foreground"
          >
            Gallery
          </motion.h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {images.map((img, i) =>
            i === 2 ? (
              <SlideshowCard
                key="slideshow"
                fallbackImg={img}
                excludeUrls={staticUrls}
                index={i}
              />
            ) : i === 3 ? (
              <SplitGalleryImage
                key={`${img.alt_text}-${i}`}
                primaryImg={img}
                portraitImg={images[2] || img}
              />
            ) : (
              <GalleryImage key={`${img.alt_text}-${i}`} img={img} index={i} />
            )
          )}
        </motion.div>

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
    variants={fadeUp}
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

const SplitGalleryImage = ({
  primaryImg,
  portraitImg,
}: {
  primaryImg: { image_url: string; alt_text: string; span: string };
  portraitImg: { image_url: string; alt_text: string; span: string };
}) => (
  <motion.div
    variants={fadeUp}
    className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 overflow-hidden ${primaryImg.span}`}
  >
    <img
      src={primaryImg.image_url}
      alt={primaryImg.alt_text}
      className="h-64 md:h-80 w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] hover:scale-105 cursor-pointer"
      loading="lazy"
    />
    <img
      src={portraitImg.image_url}
      alt={portraitImg.alt_text}
      className="aspect-[9/16] h-64 md:h-80 w-auto max-w-[42vw] object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] hover:scale-105 cursor-pointer"
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
          transition={{ duration: 3, ease: [0.3, 0, 0.2, 1] }}
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
