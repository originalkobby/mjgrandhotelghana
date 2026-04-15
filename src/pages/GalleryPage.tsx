import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import galleryPool from "@/assets/gallery-pool.jpg";
import galleryLobby from "@/assets/gallery-lobby.jpg";
import galleryGarden from "@/assets/gallery-garden.jpg";
import galleryBeach from "@/assets/gallery-beach.jpg";

const fallbackImages = [
  { image_url: galleryPool, alt_text: "Hotel lounge with leather seating", size: "wide" },
  { image_url: galleryBeach, alt_text: "Head chef preparing fresh ingredients", size: "normal" },
  { image_url: galleryGarden, alt_text: "MJ Pool Bar", size: "normal" },
  { image_url: galleryLobby, alt_text: "Poolside cabana and sun loungers", size: "wide" },
];

const sizeClasses: Record<string, string> = {
  normal: "col-span-1 row-span-1",
  wide: "md:col-span-2 row-span-1",
  tall: "col-span-1 md:row-span-2",
};

const GalleryPage = () => {
  const { data: dbImages, isLoading } = useQuery({
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

  const images = dbImages && dbImages.length > 0
    ? dbImages.map((img) => ({ image_url: img.image_url, alt_text: img.alt_text, size: img.size }))
    : fallbackImages;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="container mx-auto px-6 lg:px-12">

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

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-[280px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-[280px]">
              {images.map((img, i) => (
                <motion.div
                  key={`${img.alt_text}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.15 + i * 0.08,
                    ease: [0.3, 0, 0.2, 1],
                  }}
                  className={`overflow-hidden ${sizeClasses[img.size] || ""}`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text}
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] hover:scale-105 cursor-pointer"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GalleryPage;
