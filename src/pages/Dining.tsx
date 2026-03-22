import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import diningBg from "@/assets/dining-bg.jpg";
import {
  ChevronLeft, UtensilsCrossed, Clock, Wine, GlassWater, Coffee,
  ConciergeBell, Moon, ShieldCheck, Sparkles, CalendarHeart, Users,
  Briefcase, PartyPopper, Heart, Leaf, ChefHat
} from "lucide-react";

import highlightChicken from "@/assets/highlight-chicken.jpg";
import highlightSpecials from "@/assets/highlight-specials.jpg";
import highlightLocal from "@/assets/highlight-local.jpg";
import highlightSeafood from "@/assets/highlight-seafood.jpg";
import highlightFish from "@/assets/highlight-fish.jpg";
import highlightVegetarian from "@/assets/highlight-vegetarian.jpg";

const ease = [0.3, 0, 0.2, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease } },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};

const signatureHighlights = [
  { image: highlightChicken, title: "Elevated Jollof Rice", description: "Served with grilled premium proteins" },
  { image: highlightSpecials, title: "Slow-Cooked Local Stews", description: "With modern plating techniques" },
  { image: highlightSeafood, title: "Fresh Seafood", description: "Infused with West African spices" },
  { image: highlightFish, title: "Gourmet Continental", description: "International selections refined" },
  { image: highlightLocal, title: "Pasta & Grilled Specialties", description: "International flavors, local heart" },
  { image: highlightVegetarian, title: "Vegetarian Options", description: "Health-conscious and flavorful" },
];

const barOfferings = [
  { icon: Wine, text: "Signature cocktails inspired by tropical flavors" },
  { icon: GlassWater, text: "Premium wines and champagne" },
  { icon: Sparkles, text: "A curated selection of international spirits" },
  { icon: Coffee, text: "Freshly crafted mocktails and beverages" },
];

const roomServiceFeatures = [
  { icon: Clock, text: "24-hour room service" },
  { icon: Moon, text: "Carefully curated late-night menu" },
  { icon: ConciergeBell, text: "Prompt and discreet delivery" },
];

const eventTypes = [
  { icon: Briefcase, text: "Executive business lunches" },
  { icon: PartyPopper, text: "Birthday and anniversary celebrations" },
  { icon: UtensilsCrossed, text: "Private dinners" },
  { icon: Users, text: "Corporate events" },
  { icon: CalendarHeart, text: "Wedding receptions and social gatherings" },
];

const openingHours = [
  { meal: "Breakfast", time: "6:30 AM – 10:30 AM" },
  { meal: "Lunch", time: "12:00 PM – 3:00 PM" },
  { meal: "Dinner", time: "6:00 PM – 10:30 PM" },
];

const Dining = () => {
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
          <Link
            to="/menu"
            className="text-cream/80 hover:text-gold transition-colors duration-300 font-sans text-sm font-medium tracking-wide"
          >
            Menu
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative pt-16 pb-20 text-center bg-cover bg-center"
        style={{ backgroundImage: `url(${diningBg})` }}
      >
        <div className="absolute inset-0 bg-overlay-heavy" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mb-4 font-sans text-sm uppercase tracking-[0.3em] text-gold"
        >
          Dining at MJ Grand Hotel
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 max-w-4xl mx-auto leading-tight"
        >
          A Culinary Experience Where Ghana Meets the World
        </motion.h1>
        <div className="w-20 h-[2px] bg-gold mx-auto mb-6" />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease }}
          className="font-sans text-cream/60 max-w-2xl mx-auto text-base md:text-lg leading-relaxed"
        >
          At MJ Grand Hotel, dining is an immersive journey that celebrates the rich flavors of Ghana while embracing the finesse of international cuisine. Our culinary philosophy blends authentic local ingredients with modern global techniques, creating a refined fusion that delights both local and international guests.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0, ease }}
          className="font-sans text-cream/50 max-w-2xl mx-auto mt-4 text-sm leading-relaxed"
        >
          Every dish is thoughtfully crafted, beautifully presented, and served within an atmosphere of contemporary elegance.
        </motion.p>
        </div>
      </section>

      {/* The Restaurant */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-3xl md:text-4xl text-cream mb-4"
            >
              The Restaurant
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
              className="w-12 h-[2px] bg-gold mx-auto mb-8"
            />
            <motion.p
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              className="font-sans text-cream/60 leading-relaxed mb-6"
            >
              Our signature restaurant offers a sophisticated yet welcoming setting — ideal for executive lunches, romantic dinners, and refined family gatherings.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              className="font-sans text-cream/50 leading-relaxed"
            >
              With stylish interiors, ambient lighting, and attentive service, our restaurant creates the perfect balance between modern luxury and cultural warmth.
            </motion.p>
          </div>

          {/* Opening Hours */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-wrap justify-center gap-4 mt-12 max-w-2xl mx-auto"
          >
            {openingHours.map((h, i) => {
              const variant = i === 0 ? slideFromLeft : i === 2 ? slideFromRight : fadeUp;
              return (
                <motion.div
                  key={h.meal}
                  variants={variant}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: "tween", duration: 0.25, ease }}
                  className="flex-1 min-w-[160px] p-5 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300 text-center"
                >
                  <Clock size={18} className="text-gold mx-auto mb-2" />
                  <h4 className="font-serif text-sm font-semibold text-cream">{h.meal}</h4>
                  <p className="font-sans text-xs text-cream/50 mt-1">{h.time}</p>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="font-sans text-cream/40 text-sm text-center mt-6 italic"
          >
            Open to both resident and non-resident guests.
          </motion.p>
        </div>
      </section>

      {/* Signature Highlights */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-3xl md:text-4xl text-cream mb-4"
            >
              Ghanaian-Inspired, Globally Refined
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
              className="w-12 h-[2px] bg-gold mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              className="font-sans text-cream/60 max-w-2xl mx-auto leading-relaxed"
            >
              Our menu celebrates Ghana's vibrant culinary heritage while incorporating international influences for a contemporary twist.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {signatureHighlights.map((item, i) => {
              const col = i % 3;
              const variant = col === 0 ? slideFromLeft : col === 2 ? slideFromRight : fadeUp;
              return (
                <motion.div
                  key={i}
                  variants={variant}
                  className="group cursor-pointer rounded-xl overflow-hidden border border-cream/5 bg-cream/[0.02] hover:border-gold/20 hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] transition-all duration-500"
                >
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <h3 className="font-serif text-lg text-cream">{item.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-sm font-semibold text-gold tracking-wide uppercase group-hover:text-gold/80 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs text-cream/50 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                    <Link
                      to="/menu"
                      className="inline-block mt-3 font-sans text-xs font-medium text-accent hover:text-gold transition-colors duration-300 underline underline-offset-4 decoration-accent/30 hover:decoration-accent"
                    >
                      See Details
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="font-sans text-cream/40 text-sm text-center mt-8 italic"
          >
            Each plate reflects creativity, freshness, and a commitment to exceptional taste.
          </motion.p>
        </div>
      </section>

      {/* Bar & Lounge */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-3xl md:text-4xl text-cream mb-4"
            >
              The Bar & Lounge
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
              className="w-12 h-[2px] bg-gold mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              className="font-sans text-cream/60 max-w-2xl mx-auto leading-relaxed"
            >
              Unwind in our elegant bar and lounge — a refined space designed for relaxation and conversation.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto"
          >
            {barOfferings.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={i}
                  variants={isLeft ? slideFromLeft : slideFromRight}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: "tween", duration: 0.25, ease }}
                  className="flex items-center gap-4 p-5 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300"
                >
                  <item.icon size={20} className="text-gold shrink-0" />
                  <span className="font-sans text-sm text-cream/70">{item.text}</span>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="font-sans text-cream/50 text-sm text-center mt-8 max-w-xl mx-auto"
          >
            Whether enjoying an evening drink, hosting a private meeting, or relaxing after a long day, our lounge provides a sophisticated escape.
          </motion.p>
        </div>
      </section>

      {/* In-Room Dining */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-3xl md:text-4xl text-cream mb-4"
            >
              In-Room Dining
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
              className="w-12 h-[2px] bg-gold mx-auto mb-8"
            />
            <motion.p
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              className="font-sans text-cream/60 leading-relaxed mb-8"
            >
              For guests who prefer privacy, our in-room dining service delivers the full restaurant experience directly to your suite.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto"
          >
            {roomServiceFeatures.map((item, i) => {
              const variant = i === 0 ? slideFromLeft : i === 2 ? slideFromRight : fadeUp;
              return (
                <motion.div
                  key={i}
                  variants={variant}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: "tween", duration: 0.25, ease }}
                  className="flex-1 min-w-[200px] flex items-center gap-4 p-5 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300"
                >
                  <item.icon size={20} className="text-gold shrink-0" />
                  <span className="font-sans text-sm text-cream/70">{item.text}</span>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="font-sans text-cream/40 text-sm text-center mt-8 italic"
          >
            Luxury and convenience, seamlessly combined.
          </motion.p>
        </div>
      </section>

      {/* Private Dining & Events */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-3xl md:text-4xl text-cream mb-4"
            >
              Private Dining & Events
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
              className="w-12 h-[2px] bg-gold mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              className="font-sans text-cream/60 max-w-2xl mx-auto leading-relaxed"
            >
              MJ Grand Hotel offers tailored culinary experiences for every occasion.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            {eventTypes.map((item, i) => {
              const col = i % 3;
              const variant = col === 0 ? slideFromLeft : col === 2 ? slideFromRight : fadeUp;
              return (
                <motion.div
                  key={i}
                  variants={variant}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: "tween", duration: 0.25, ease }}
                  className="flex items-center gap-4 p-5 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300"
                >
                  <item.icon size={20} className="text-gold shrink-0" />
                  <span className="font-sans text-sm text-cream/70">{item.text}</span>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="font-sans text-cream/50 text-sm text-center mt-8 max-w-xl mx-auto"
          >
            Our culinary team works closely with clients to create personalized menus and memorable dining experiences.
          </motion.p>
        </div>
      </section>

      {/* Featured Dining Experience — Sunday Buffet */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-3xl md:text-4xl text-cream mb-4"
            >
              Featured Dining Experience
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
              className="w-12 h-[2px] bg-gold mx-auto mb-6"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease }}
            className="w-full"
          >
            <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal via-charcoal to-charcoal/95 border border-gold/20">
              {/* Decorative gold accents */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(198,165,92,0.08)_0%,_transparent_60%)]" />

              <div className="relative px-6 py-14 sm:px-12 sm:py-20 text-center">
                <span className="inline-block font-sans text-xs uppercase tracking-[0.3em] text-gold mb-5">
                  ✨ Weekend Special
                </span>

                <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl text-cream leading-tight mb-6">
                  Special Sunday Buffet
                </h3>

                <div className="w-16 h-[2px] bg-gold/50 mx-auto mb-6" />

                <p className="font-sans text-cream/70 leading-relaxed max-w-2xl mx-auto mb-4">
                  Indulge in a delightful culinary experience every Sunday at MJ Grand Hotel with our Special Sunday Buffet, carefully curated to offer a rich selection of local and international dishes.
                </p>
                <p className="font-sans text-cream/50 leading-relaxed max-w-2xl mx-auto mb-8 text-sm">
                  Whether you're dining with family, friends, or colleagues, our buffet provides the perfect setting for a relaxing and enjoyable afternoon.
                </p>

                <p className="font-serif text-3xl sm:text-4xl font-bold text-gold mb-3">
                  GHS 250 <span className="text-base font-normal text-cream/40">per person</span>
                </p>

                <p className="font-sans text-cream/40 text-sm leading-relaxed max-w-lg mx-auto mb-10">
                  Enjoy a variety of freshly prepared meals, expertly crafted by our chefs to deliver both quality and taste in every bite.
                </p>

                <a
                  href="tel:0573338062"
                  className="inline-block bg-gold px-10 py-4 font-sans text-sm font-semibold uppercase tracking-wider text-charcoal rounded-lg hover:shadow-[0_0_30px_rgba(198,165,92,0.4)] transition-all duration-300"
                >
                  Reserve a Table
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Culinary Commitment */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-3xl md:text-4xl text-cream mb-4"
            >
              Our Culinary Commitment
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
              className="w-12 h-[2px] bg-gold mx-auto mb-8"
            />
            <motion.p
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              className="font-sans text-cream/60 leading-relaxed mb-4"
            >
              We prioritize freshness, hygiene, and excellence in every detail. Our chefs source high-quality ingredients and blend traditional Ghanaian flavors with international techniques to deliver innovative, memorable dishes.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.4, ease }}
              className="font-sans text-gold/80 font-medium italic"
            >
              At MJ Grand Hotel, dining is not simply a service — it is an expression of culture, creativity, and refined taste.
            </motion.p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">Reserve Your Table</h2>
            <div className="w-12 h-[2px] bg-gold mx-auto mb-6" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="font-sans text-cream/60 leading-relaxed mb-8"
            >
              We invite you to indulge in a dining experience that harmonizes tradition with modern elegance. For reservations or inquiries, please get in touch with our front desk.
            </motion.p>
            <a
              href="tel:0573338062"
              className="inline-block bg-gold px-8 py-3.5 font-sans text-sm font-semibold uppercase tracking-wider text-charcoal hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
            >
              Reserve a Table
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Dining;
