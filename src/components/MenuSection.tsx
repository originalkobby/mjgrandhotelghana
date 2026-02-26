import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type MenuItem = {
  name: string;
  description: string;
  price: string;
};

type MenuSectionProps = {
  title: string;
  subtitle?: string;
  items: MenuItem[];
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const ease = [0.3, 0, 0.2, 1] as const;

export const getItemVariants = (index: number, cols: number) => {
  if (cols <= 1) {
    return {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
    };
  }

  const col = index % cols;
  const isLeft = col === 0;
  const isRight = col === cols - 1;

  const hidden = {
    opacity: 0,
    x: isLeft ? -60 : isRight ? 60 : 0,
    y: !isLeft && !isRight ? 30 : 0,
  };

  return {
    hidden,
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.6, ease } },
  };
};

const MenuSection = ({ title, subtitle, items, image, imageAlt, reverse = false }: MenuSectionProps) => {
  const [cols, setCols] = useState(1);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w >= 1280 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section className="py-16 md:py-24">
      <div
        className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 lg:gap-16 items-center`}
      >
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: reverse ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease }}
          className="w-full lg:w-1/2 flex-shrink-0"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={image}
              alt={imageAlt}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>

        {/* Menu Text */}
        <div className="w-full lg:w-1/2">
          <motion.div
            initial={{ opacity: 0, x: reverse ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease }}
            className="mb-8"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-cream tracking-wide">{title}</h2>
            {subtitle && (
              <p className="font-sans text-cream/50 text-sm mt-2">{subtitle}</p>
            )}
            <div className="w-16 h-[2px] bg-gold mt-4" />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {items.map((item, i) => (
              <motion.div
                key={i}
                variants={getItemVariants(i, cols)}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "tween", duration: 0.25, ease }}
                className="group p-4 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300 cursor-default"
              >
                <h3 className="font-serif text-sm font-bold text-gold tracking-wide uppercase leading-tight">
                  {item.name}
                </h3>
                <p className="font-sans text-[11px] text-cream/45 mt-1 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
                <p className="font-sans text-sm font-bold text-gold/90 mt-2">
                  {item.price}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
