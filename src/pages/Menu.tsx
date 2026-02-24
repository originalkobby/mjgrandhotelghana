import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import menuCover from "@/assets/menu-cover.jpg";
import menuAppetizers from "@/assets/menu-appetizers.jpg";
import menuSalads from "@/assets/menu-salads.jpg";
import menuChicken from "@/assets/menu-chicken.jpg";
import menuFish from "@/assets/menu-fish.jpg";
import menuBeef from "@/assets/menu-beef.jpg";
import menuSeafood from "@/assets/menu-seafood.jpg";
import menuSpecials from "@/assets/menu-specials.jpg";
import menuLocal from "@/assets/menu-local.jpg";
import menuBurgers from "@/assets/menu-burgers.jpg";

const menuPages = [
  { src: menuCover, alt: "MJ Grand Hotel Kitchen Menu Cover - Akwaaba! Eat Healthy, Live Life!" },
  { src: menuAppetizers, alt: "Hot Appetizers - Spicy Chicken Wings, Beef Cocktail Khebab, Beef Samosa, and more" },
  { src: menuSalads, alt: "Cold Larder - Chef's Salad, MJ Special Salad, Seafood Salad, and more" },
  { src: menuChicken, alt: "Chicken Meals & Kids Meals - Spicy Grilled Chicken, Hawaiian Chicken, and more" },
  { src: menuFish, alt: "Fish Meals - Grilled Casava Fish, Grouper Fillet, Tilapia, and more" },
  { src: menuBeef, alt: "Beef Meals & Extras - Beef Pepper Steak, MJ Mixed Grill, and more" },
  { src: menuSeafood, alt: "Sea Food - Mediterranean Seafood, Grilled Lobster, and more" },
  { src: menuSpecials, alt: "MJ Specials & Spaghetti/Noodles - MJ Fried Rice, Jollof Rice, and more" },
  { src: menuLocal, alt: "Local Dishes - Goat Light Soup, Ebunuebunu, Garden Eggs Stew, and more" },
  { src: menuBurgers, alt: "Burgers, Sandwiches, Shawarma, Pizza - Chicken Burger, MJ Pepperoni Pizza, and more" },
];

const Menu = () => {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-nav py-4">
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-cream/80 hover:text-gold transition-colors duration-300 font-sans text-sm"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <span className="font-serif text-xl tracking-wider text-cream">Kitchen Menu</span>
          <div className="w-24" />
        </div>
      </div>

      {/* Menu Images */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">Our Kitchen Menu</h1>
          <div className="w-20 h-[2px] bg-gold mx-auto mb-4" />
          <p className="font-sans text-cream/60 max-w-xl mx-auto">
            Explore our carefully curated selection of dishes, from local Ghanaian delicacies to international favorites.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-8 max-w-3xl mx-auto">
          {menuPages.map((page, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="w-full rounded-lg overflow-hidden shadow-2xl"
            >
              <img
                src={page.src}
                alt={page.alt}
                className="w-full h-auto"
                loading={i > 1 ? "lazy" : "eager"}
              />
            </motion.div>
          ))}
        </div>
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
