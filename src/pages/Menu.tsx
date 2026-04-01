import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MenuSection, { getItemVariants } from "@/components/MenuSection";
import { usePublicMenu, MENU_SECTIONS } from "@/hooks/usePublicMenu";
import { Skeleton } from "@/components/ui/skeleton";

import menuF1 from "@/assets/menu-f1.png";
import menuF2 from "@/assets/menu-f2.png";
import menuF3 from "@/assets/menu-f3.png";
import menuF4 from "@/assets/menu-f4.png";
import menuF5 from "@/assets/menu-f5.png";
import menuF6 from "@/assets/menu-f6.jpg";
import menuF7 from "@/assets/menu-f7.jpg";
import menuF8 from "@/assets/menu-f8.jpg";
import menuF9 from "@/assets/menu-f9.jpg";
import menuF10 from "@/assets/menu-f10.jpg";
import menuF11 from "@/assets/menu-f11.jpg";

// Section config: which sections get full images vs compact display
type SectionConfig = {
  image?: string;
  imageAlt?: string;
  subtitle?: string;
  reverse?: boolean;
  compact?: boolean;
};

const SECTION_CONFIG: Record<string, SectionConfig> = {
  "Hot Appetizers": { image: menuF1, imageAlt: "Hot appetizers food collage featuring chicken wings, beef kebab, and prawns" },
  "Salads": { image: menuF2, imageAlt: "Cold larder food collage featuring fresh salads and vegetables", subtitle: "Fresh salads & light bites", reverse: true },
  "Chicken Meals": { image: menuF3, imageAlt: "Chicken meals food collage featuring grilled and fried chicken dishes" },
  "Kids Meals": { compact: true },
  "Fish Meals": { image: menuF4, imageAlt: "Fish meals food collage featuring grilled tilapia, grouper, and snapper", reverse: true },
  "Beef Meals": { image: menuF5, imageAlt: "Beef meals food collage featuring steak, mixed grill, and beef stew" },
  "Extras": { compact: true },
  "Seafood": { image: menuF6, imageAlt: "Seafood food collage featuring lobster, prawns, and shrimps", reverse: true },
  "MJ Specials": { image: menuF7, imageAlt: "MJ Specials food collage featuring fried rice, jollof rice, and pasta" },
  "Local Dishes": { image: menuF8, imageAlt: "Local dishes food collage featuring light soup, okro soup, and garden eggs stew", reverse: true },
  "Burgers & Sandwiches": { image: menuF9, imageAlt: "Burgers, sandwiches and pizza food collage" },
  "Pizza": { compact: true },
  "Desserts": { image: menuF10, imageAlt: "Desserts food collage featuring fruit platter, ice cream, and pudding", reverse: true },
  "Take Out Packs": { compact: true },
  "Vegetarian": { image: menuF11, imageAlt: "Vegetarian dishes food collage featuring stir fried vegetables, hummus, and vegetable soup" },
  "Side Orders": { compact: true },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const CompactSection = ({ title, items }: { title: string; items: { name: string; description: string; price: string }[] }) => {
  const [cols, setCols] = useState(1);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w >= 640 ? 3 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="-mt-12 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
      >
        <h3 className="font-serif text-2xl text-cream mb-2">{title}</h3>
        <div className="w-12 h-[2px] bg-gold mb-6" />
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            variants={getItemVariants(i, cols)}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "tween", duration: 0.25, ease: [0.3, 0, 0.2, 1] }}
            className="p-4 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300 cursor-default"
          >
            <h4 className="font-serif text-sm font-bold text-gold tracking-wide uppercase">{item.name}</h4>
            {item.description && (
              <p className="font-sans text-[11px] text-cream/45 mt-1 leading-relaxed">{item.description}</p>
            )}
            <p className="font-sans text-sm font-bold text-gold/90 mt-2">{item.price}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

const Menu = () => {
  const { data: menuData, isLoading } = usePublicMenu();

  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar />

      {/* Hero */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mb-4"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.3, 0, 0.2, 1] }}
            className="font-serif text-4xl md:text-5xl text-cream mb-4"
          >
            Our Kitchen Menu
          </motion.h1>
          <div className="w-20 h-[2px] bg-gold mx-auto mb-4" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.3, 0, 0.2, 1] }}
            className="font-sans text-cream/60 max-w-xl mx-auto"
          >
            Explore our carefully curated selection of dishes, from local Ghanaian delicacies to international favorites.
          </motion.p>
        </motion.div>
      </div>

      {/* Menu Sections */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        {isLoading ? (
          <div className="space-y-8 py-16">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col lg:flex-row gap-10 items-center">
                <Skeleton className="w-full lg:w-1/2 h-64 rounded-2xl bg-cream/5" />
                <div className="w-full lg:w-1/2 space-y-4">
                  <Skeleton className="h-8 w-48 bg-cream/5" />
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(6)].map((_, j) => (
                      <Skeleton key={j} className="h-24 rounded-xl bg-cream/5" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          MENU_SECTIONS.map((section) => {
            const items = menuData?.[section];
            if (!items?.length) return null;
            const config = SECTION_CONFIG[section] || { compact: true };

            if (config.compact) {
              return <CompactSection key={section} title={section} items={items} />;
            }

            return (
              <MenuSection
                key={section}
                title={section}
                subtitle={config.subtitle}
                image={config.image!}
                imageAlt={config.imageAlt!}
                items={items}
                reverse={config.reverse}
              />
            );
          })
        )}

        {/* Render any extra DB categories not in the standard list */}
        {menuData && Object.entries(menuData)
          .filter(([cat]) => !MENU_SECTIONS.includes(cat))
          .map(([cat, items]) => (
            items.length > 0 && <CompactSection key={cat} title={cat} items={items} />
          ))
        }
      </div>

      {/* Footer CTA */}
      <div className="text-center py-16 border-t border-cream/10">
        <p className="font-sans text-cream/50 text-sm mb-4">
          To order, call: <span className="text-gold">+233 302544212</span> | <span className="text-gold">+233 302544211</span>
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Menu;
