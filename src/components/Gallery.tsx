import { motion } from "framer-motion";
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

  const images = dbImages && dbImages.length > 0
    ? dbImages.map((img) => ({
        image_url: img.image_url,
        alt_text: img.alt_text,
        span: sizeToSpan[img.size] || "",
      }))
    : fallbackImages;

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
          {images.map((img, i) => (
            <GalleryImage key={`${img.alt_text}-${i}`} img={img} index={i} />
          ))}
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

const GalleryImage = ({ img, index }: { img: { image_url: string; alt_text: string; span: string }; index: number }) => {
  return (
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
};

export default Gallery;
