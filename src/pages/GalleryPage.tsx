import { motion } from "framer-motion";
import SEO from "@/components/SEO";
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

const pixiesetGridPattern = [
  "sm:row-span-2 lg:row-span-2",
  "sm:row-span-1 lg:row-span-1",
  "sm:row-span-2 lg:col-span-2 lg:row-span-2",
  "sm:row-span-3 lg:row-span-3",
  "sm:row-span-2 lg:row-span-2",
  "sm:row-span-1 lg:col-span-2 lg:row-span-1",
  "sm:row-span-3 lg:row-span-2",
  "sm:row-span-2 lg:row-span-3",
  "sm:row-span-1 lg:row-span-1",
  "sm:row-span-2 lg:col-span-2 lg:row-span-2",
  "sm:row-span-2 lg:row-span-2",
  "sm:row-span-1 lg:row-span-1",
];

const galleryFrameClasses: Record<string, string> = {
  normal: "sm:row-span-2 lg:row-span-2",
  wide: "sm:row-span-2 lg:col-span-2 lg:row-span-2",
  tall: "sm:row-span-3 lg:row-span-3",
};

const getGalleryFrameClass = (size: string | null | undefined, index: number) => {
  return size && galleryFrameClasses[size] ? galleryFrameClasses[size] : pixiesetGridPattern[index % pixiesetGridPattern.length];
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

  const dbMapped = dbImages && dbImages.length > 0
    ? dbImages.map((img) => ({ image_url: img.image_url, alt_text: img.alt_text, size: img.size }))
    : [];

  // Always show fallback (homepage) images first, then DB images after
  const images = [...fallbackImages, ...dbMapped];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Photo Gallery — MJ Grand Hotel Ghana" description="Browse photos of our rooms, restaurant, pool, and grounds at MJ Grand Hotel in East Legon, Accra." path="/gallery" />
      <Navbar />

      <section className="pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8 lg:px-10">

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 grid-flow-dense auto-rows-[230px] sm:auto-rows-[145px] md:auto-rows-[165px] lg:auto-rows-[150px] gap-[6px] md:gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={`h-full w-full rounded-none ${pixiesetGridPattern[i % pixiesetGridPattern.length]}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 grid-flow-dense auto-rows-[230px] sm:auto-rows-[145px] md:auto-rows-[165px] lg:auto-rows-[150px] gap-[6px] md:gap-2">
              {images.map((img, i) => (
                <motion.figure
                  key={`${img.alt_text}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.15 + i * 0.08,
                    ease: [0.3, 0, 0.2, 1],
                  }}
                  className={`group relative overflow-hidden bg-muted ${getGalleryFrameClass(img.size, i)}`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text}
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] group-hover:scale-[1.025]"
                    loading="lazy"
                  />
                </motion.figure>
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
