import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MenuSection from "@/components/MenuSection";
import logo from "@/assets/logo.png";

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

import {
  hotAppetizers, coldLarder, chickenMeals, kidsMeals, fishMeals,
  beefMeals, extras, seafoodMeals, mjSpecials, localDishes,
  burgersAndSandwiches, pizzaMeals, desserts, takeOutPacks,
} from "@/data/menuData";

const compactSectionItems = [
  { title: "Kids Meals", items: kidsMeals },
  { title: "Extras", items: extras },
  { title: "Take Out Packs", items: takeOutPacks },
];

const CompactSection = ({ title, items }: { title: string; items: typeof kidsMeals }) => (
  <div className="-mt-12 mb-16">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
    >
      <h3 className="font-serif text-2xl text-cream mb-2">{title}</h3>
      <div className="w-12 h-[2px] bg-gold mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 transition-all duration-300 hover:-translate-y-1"
          >
            <h4 className="font-serif text-sm font-bold text-gold tracking-wide uppercase">{item.name}</h4>
            {item.description && (
              <p className="font-sans text-[11px] text-cream/45 mt-1 leading-relaxed">{item.description}</p>
            )}
            <p className="font-sans text-sm font-bold text-gold/90 mt-2">{item.price}</p>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

const Menu = () => {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-nav py-4">
        <div className="container mx-auto px-6 lg:px-12 flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-cream/80 hover:text-gold transition-colors duration-300 font-sans text-sm"
          >
            <ChevronLeft size={18} />
            Go back
          </Link>
          <Link to="/" className="flex items-center">
            <img src={logo} alt="MJ Grand Hotel" className="h-7 w-auto" />
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mb-4"
        >
          <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">Our Kitchen Menu</h1>
          <div className="w-20 h-[2px] bg-gold mx-auto mb-4" />
          <p className="font-sans text-cream/60 max-w-xl mx-auto">
            Explore our carefully curated selection of dishes, from local Ghanaian delicacies to international favorites.
          </p>
        </motion.div>
      </div>

      {/* Menu Sections */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <MenuSection
          title="Hot Appetizers"
          image={menuF1}
          imageAlt="Hot appetizers food collage featuring chicken wings, beef kebab, and prawns"
          items={hotAppetizers}
        />

        <MenuSection
          title="Cold Larder"
          subtitle="Fresh salads & light bites"
          image={menuF2}
          imageAlt="Cold larder food collage featuring fresh salads and vegetables"
          items={coldLarder}
          reverse
        />

        <MenuSection
          title="Chicken Meals"
          image={menuF3}
          imageAlt="Chicken meals food collage featuring grilled and fried chicken dishes"
          items={chickenMeals}
        />

        <CompactSection title="Kids Meals" items={kidsMeals} />

        <MenuSection
          title="Fish Meals"
          image={menuF4}
          imageAlt="Fish meals food collage featuring grilled tilapia, grouper, and snapper"
          items={fishMeals}
          reverse
        />

        <MenuSection
          title="Beef Meals"
          image={menuF5}
          imageAlt="Beef meals food collage featuring steak, mixed grill, and beef stew"
          items={beefMeals}
        />

        <CompactSection title="Extras" items={extras} />

        <MenuSection
          title="Sea Food"
          image={menuF6}
          imageAlt="Seafood food collage featuring lobster, prawns, and shrimps"
          items={seafoodMeals}
          reverse
        />

        <MenuSection
          title="MJ Specials"
          image={menuF7}
          imageAlt="MJ Specials food collage featuring fried rice, jollof rice, and pasta"
          items={mjSpecials}
        />

        <MenuSection
          title="Local Dishes"
          image={menuF8}
          imageAlt="Local dishes food collage featuring light soup, okro soup, and garden eggs stew"
          items={localDishes}
          reverse
        />

        <MenuSection
          title="Burgers | Sandwiches | Shawarma"
          image={menuF9}
          imageAlt="Burgers, sandwiches and pizza food collage"
          items={burgersAndSandwiches}
        />

        <CompactSection title="Pizza" items={pizzaMeals} />

        <MenuSection
          title="Dessert"
          image={menuF10}
          imageAlt="Desserts food collage featuring fruit platter, ice cream, and pudding"
          items={desserts}
          reverse
        />

        <CompactSection title="Take Out Packs" items={takeOutPacks} />
      </div>

      {/* Footer CTA */}
      <div className="text-center py-16 border-t border-cream/10">
        <p className="font-sans text-cream/50 text-sm mb-4">
          To order, call: <span className="text-gold">0573338062</span> | <span className="text-gold">0531024536</span>
        </p>
        <Link
          to="/"
          className="inline-block border border-gold/60 px-8 py-3 font-sans font-medium tracking-wide text-cream hover:bg-gold hover:text-charcoal transition-all duration-300"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Menu;
