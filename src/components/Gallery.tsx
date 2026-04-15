import { motion } from "framer-motion";
import galleryPool from "@/assets/gallery-pool.jpg";
import galleryLobby from "@/assets/gallery-lobby.jpg";
import galleryGarden from "@/assets/gallery-garden.jpg";
import galleryBeach from "@/assets/gallery-beach.jpg";

const images = [
  { src: galleryPool, alt: "Hotel lounge with leather seating", span: "md:col-span-2" },
  { src: galleryBeach, alt: "Head chef preparing fresh ingredients in the hotel kitchen", span: "" },
  { src: galleryGarden, alt: "MJ Pool Bar", span: "" },
  { src: galleryLobby, alt: "Poolside cabana and sun loungers", span: "md:col-span-2" },
];

const Gallery = () => {
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
            <GalleryImage key={img.alt} img={img} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

const GalleryImage = ({ img, index }: { img: typeof images[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.3, 0, 0.2, 1] }}
      className={`overflow-hidden ${img.span}`}
    >
      <img
        src={img.src}
        alt={img.alt}
        className="w-full h-64 md:h-80 object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] hover:scale-105 cursor-pointer"
        loading="lazy"
      />
    </motion.div>
  );
};

export default Gallery;
