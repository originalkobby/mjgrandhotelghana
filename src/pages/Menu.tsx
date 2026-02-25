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

const hotAppetizers = [
  { name: "Spicy Chicken Wings", description: "Juicy fried chicken wings in hot green chilli sauce", price: "Ghc 90" },
  { name: "Beef Cocktail Khebab", description: "Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato", price: "Ghc 100" },
  { name: "Beef Samosa", description: "Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato", price: "Ghc 80" },
  { name: "Hot Chilli Gizzard", description: "Chilli sauce, tender fried gizzard", price: "Ghc 85" },
  { name: "Honey Glazed Chicken Wings", description: "Juicy fried chicken wings in spicy honey", price: "Ghc 90" },
  { name: "Golden Fried Prawns", description: "Marinated prawns, bread crumbs, cocktail sauce", price: "Ghc 120" },
  { name: "Goat Meat Pepper Soup", description: "Goat meat pieces, hot pepper soup stock (serve with bread rolls)", price: "Ghc 150" },
  { name: "Chicken Cocktail Kebab", description: "Tender chicken, white pepper grilled bell pepper, onion & tomato", price: "Ghc 120" },
  { name: "Shrimps Avocado Cocktail", description: "Spicy steamed shrimps, cocktail sauce, lettuce, cucumber, fresh tomato, celery", price: "Ghc 120" },
  { name: "Chicken Pepper Soup", description: "Diced chicken, hot pepper soup stock (serve with bread rolls)", price: "Ghc 120" },
  { name: "Mix Vegetable Soup", description: "Mushroom, carrot, french beans, zucchini, cabbage, pumpkin, vegetables stock, bouquet-garni (serve with bread rolls)", price: "Ghc 120" },
  { name: "Pumpkin Soup", description: "Vegetables stock, pumpkin, bouquet (serve with bread rolls)", price: "Ghc 100" },
];

const coldLarder = [
  { name: "Chef's Salad", description: "Lettuce, tomato, carrot, cucumber, onions, chicken flakes, black olives, boiled egg, sliced apple", price: "Ghc 150" },
  { name: "MJ Special Salad", description: "Lettuce, fresh tomato, carrot, cucumber, onions, chicken flakes, beef flakes, shrimps, boiled egg, black olives", price: "Ghc 200" },
  { name: "Seafood Salad", description: "Prawns, squid, grouper fish, lettuce, fresh tomato, carrot, cucumber, onions, tartar sauce", price: "Ghc 250" },
  { name: "Greek Salad", description: "Lettuce, fresh tomato, cucumber, onions, black olives, feta cheese, vinaigrette dressing", price: "Ghc 110" },
  { name: "Ghanaian Salad", description: "Lettuce, carrot, cucumber, onions, boiled egg, baked beans, sardine, fresh tomato, black olives", price: "Ghc 200" },
  { name: "Tuna Salad", description: "Chunk tuna, lettuce, fresh tomato, onions, cucumber, carrot, olive oil, white pepper, black olive", price: "Ghc 120" },
  { name: "Potato Salad", description: "Potatoes, cucumber, carrot, green bell pepper, onions, egg", price: "Ghc 100" },
  { name: "Chicken Caesar Salad", description: "Lettuce, sun-dried tomatoes, onions, grilled chicken flakes, black olives, parmesan cheese, croutons", price: "Ghc 120" },
];

const chickenMeals = [
  { name: "Spicy Grilled Chicken", description: "", price: "Ghc 150" },
  { name: "Hawaiian Chicken Khebeb", description: "", price: "Ghc 150" },
  { name: "Chicken Alfredo", description: "", price: "Ghc 180" },
  { name: "Chicken Khebab", description: "", price: "Ghc 130" },
  { name: "Chicken Fried Rice", description: "", price: "Ghc 160" },
  { name: "Chicken Soup", description: "", price: "Ghc 180" },
  { name: "Spicy Turkey Wings", description: "", price: "Ghc 150" },
  { name: "Grilled/Fried Chicken Breast", description: "", price: "Ghc 150" },
  { name: "Chicken Breast Veg Stir Fry", description: "", price: "Ghc 150" },
  { name: "Shredded Chicken Sauce", description: "", price: "Ghc 150" },
  { name: "Chicken Provençal", description: "", price: "Ghc 180" },
  { name: "Saucy Chicken Pasta", description: "", price: "Ghc 180" },
];

const kidsMeals = [
  { name: "Crispy Chicken Fingers", description: "", price: "Ghc 100" },
  { name: "Diced Chicken & Pasta in Tomato Sauce", description: "", price: "Ghc 150" },
  { name: "Mini-Chicken & Rice", description: "", price: "Ghc 120" },
];

const fishMeals = [
  { name: "Grilled/Fried Casava Fish", description: "Juicy fried chicken wings in hot green chilli sauce", price: "Ghc 170" },
  { name: "Grilled/Fried Grouper Fillet", description: "Ginger, garlic, complete seasoning, lemon juice, mustard, fresh parsley. Side orders: potato chips, jollof rice, steamed rice, fried rice, sautéed potatoes, fried yam, fried plantain, mashed potatoes", price: "Ghc 200" },
  { name: "Grilled/Fried Tilapia", description: "Black pepper, cayenne pepper, ginger, garlic, lemon juice, complete seasoning. M / L sizes. Side orders: banku, fried rice, fried yam, jollof rice, steamed rice, potato chips", price: "M: Ghc 150 / L: Ghc 200" },
  { name: "Fish Fingers", description: "Shredded grouper fillet, ginger, garlic, white pepper, egg, breadcrumbs", price: "Ghc 200" },
  { name: "Grilled/Fried Snapper Fish", description: "Cayenne pepper, ginger, garlic, lemon juice, complete seasoning. Side orders: potato chips, jollof rice, steamed rice, fried rice, fried yam, fried plantain", price: "Ghc 150" },
  { name: "Fish Khebab", description: "Grouper fillet, ginger, garlic, white pepper, grilled onions, green bell pepper & tomato", price: "Ghc 200" },
  { name: "Breaded Fish Fillet", description: "White pepper, ginger, garlic, breadcrumbs", price: "Ghc 200" },
  { name: "Grilled/Fried Barracuba Fish", description: "Complete seasoning, lemon juice, mustard, ginger, garlic, white pepper. Side orders: potato chips, jollof rice, steamed rice, fried rice, fried yam, mashed potatoes", price: "Ghc 180" },
  { name: "Tilapia Stew", description: "Tomato sauce, carrot, zucchini, bell pepper, white wine", price: "Ghc 200" },
  { name: "Grouper Provençal", description: "", price: "Ghc 200" },
  { name: "Snapper Provençal", description: "", price: "Ghc 150" },
  { name: "Breaded Fish Fillet", description: "", price: "Ghc 200" },
];

const beefMeals = [
  { name: "Beef Pepper Steak", description: "Beef fillet, mustard, black pepper, salt, grilled tomato, onion ring", price: "Ghc 190" },
  { name: "MJ Mixed Grill", description: "Goat meat, beef, chicken, sausage, vegetable, fried egg", price: "Ghc 220" },
  { name: "Beef Provençal", description: "Juicy fried beef, fresh tomato sauce, vegetables, red wine", price: "Ghc 200" },
  { name: "Grilled T-Bone Steak", description: "Bone-in tenderloin, garlic/ginger powder, mustard, salt, black pepper", price: "Ghc 200" },
  { name: "Shredded Beef Sauce", description: "Shredded beef fillet, carrot, onions, bell pepper, oyster sauce, butter, soy sauce", price: "Ghc 190" },
  { name: "Grilled Goat", description: "", price: "Ghc 200" },
  { name: "Assorted Meat Pot", description: "Goat, meat, beef", price: "Ghc 180" },
  { name: "Hawaiian Beef Khebab", description: "", price: "Ghc 150" },
  { name: "Beef Stroganoff", description: "", price: "Ghc 180" },
  { name: "Saucy Beef Pasta", description: "", price: "Ghc 190" },
];

const extras = [
  { name: "Extra Stew", description: "", price: "Ghc 30" },
  { name: "Extra Vegetables", description: "", price: "Ghc 40" },
  { name: "Extra Pepper", description: "", price: "Ghc 20" },
];

const Menu = () => {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-nav py-4">
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="MJ Grand Hotel" className="h-7 w-auto" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-cream/80 hover:text-gold transition-colors duration-300 font-sans text-sm"
          >
            <ChevronLeft size={18} />
            Go back
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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

        {kidsMeals.length > 0 && (
          <div className="-mt-12 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-serif text-2xl text-cream mb-2">Kids Meals</h3>
              <div className="w-12 h-[2px] bg-gold mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {kidsMeals.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 transition-all duration-300 hover:-translate-y-1"
                  >
                    <h4 className="font-serif text-sm font-bold text-gold tracking-wide uppercase">{item.name}</h4>
                    <p className="font-sans text-sm font-bold text-gold/90 mt-2">{item.price}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

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

        {extras.length > 0 && (
          <div className="-mt-12 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-serif text-2xl text-cream mb-2">Extras</h3>
              <div className="w-12 h-[2px] bg-gold mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {extras.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 transition-all duration-300 hover:-translate-y-1"
                  >
                    <h4 className="font-serif text-sm font-bold text-gold tracking-wide uppercase">{item.name}</h4>
                    <p className="font-sans text-sm font-bold text-gold/90 mt-2">{item.price}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
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
