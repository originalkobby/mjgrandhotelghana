import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bed, Wifi, Wind, Tv, Bath, Clock, UtensilsCrossed, Wine, Building2, Waves, Dumbbell, Shield, Plane, Heart, Scale, Users, Lightbulb, Lock, MessageCircle, Award } from "lucide-react";
import aboutHeroBg from "@/assets/about-hero.jpg";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

const roomFeatures = [
  { icon: Bed, text: "Premium bedding and spacious interiors" },
  { icon: Wifi, text: "High-speed Wi-Fi" },
  { icon: Wind, text: "Air conditioning" },
  { icon: Tv, text: "Smart TV with satellite channels" },
  { icon: Bath, text: "Modern bathrooms with quality amenities" },
  { icon: Clock, text: "24-hour room service" },
];

const facilities = [
  { icon: UtensilsCrossed, text: "Fine dining restaurant offering local and international cuisine" },
  { icon: Wine, text: "Stylish bar and lounge" },
  { icon: Building2, text: "State-of-the-art conference and event venues" },
  { icon: Waves, text: "A serene swimming pool" },
  { icon: Dumbbell, text: "A fully equipped fitness center" },
  { icon: Shield, text: "24-hour reception and advanced security services" },
  { icon: Plane, text: "Executive airport transfer arrangements" },
];

const coreValues = [
  { icon: Award, title: "Timeous", subtitle: "Ownership & Complete Accountability", desc: "We empower our team to take full ownership of their responsibilities and deliver with efficiency, precision, and accountability within expected timelines." },
  { icon: Scale, title: "Compliance", subtitle: "Strict Adherence to Standards", desc: "We maintain unwavering commitment to internal policies, regulatory requirements, and global hospitality standards in all processes and procedures." },
  { icon: Heart, title: "Respect", subtitle: "", desc: "We honor the objectives of our stakeholders, value the expectations of our guests, and embrace the cultural diversity of every community in which we operate." },
  { icon: Users, title: "Commitment", subtitle: "Passion-Driven Excellence", desc: "We cultivate a culture of enthusiasm and dedication, inspiring our team to perform their roles with pride, integrity, and unwavering passion." },
  { icon: Lightbulb, title: "Innovation", subtitle: "Process Efficiency & Continuous Improvement", desc: "We continuously refine our systems and services to remain aligned with the evolving expectations of our guests, investors, and stakeholders." },
  { icon: Lock, title: "Confidentiality", subtitle: "Stakeholder Sensitivity & Trust", desc: "We uphold the highest standards of discretion, safeguarding all information entrusted to us in strict accordance with legal and ethical obligations." },
  
];

const About = () => {
  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar />

      {/* Hero */}
      <section className="relative w-full h-screen flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={aboutHeroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-charcoal/50" />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mb-4 font-sans text-sm font-bold uppercase tracking-[0.3em] text-gold"
        >
          About MJ Grand Hotel
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 max-w-4xl mx-auto leading-tight"
        >
          Experience Refined Luxury
        </motion.h1>
        <div className="w-20 h-[2px] bg-gold mx-auto mb-6" />
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 border-b border-cream/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="font-sans text-cream/60 text-base md:text-lg leading-relaxed"
          >
            Welcome to MJ Grand Hotel, where sophistication meets exceptional hospitality. Designed for discerning travelers who appreciate comfort, elegance, and world-class service, MJ Grand Hotel offers a premium stay experience in a serene and secure environment.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
            className="font-sans text-cream/50 mt-4 text-sm leading-relaxed"
          >
            Whether you are visiting for business, leisure, or a special occasion, our commitment is to deliver an unforgettable stay defined by excellence, comfort, and personalized service.
          </motion.p>
        </div>
      </section>

      {/* Our Story */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-12 pt-[76px] pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2 variants={slideFromLeft} className="font-serif text-3xl md:text-4xl text-cream mb-4">
            Our Story
          </motion.h2>
          <motion.div variants={fadeIn} className="w-12 h-[2px] bg-gold mx-auto mb-8" />
          <motion.p variants={slideFromRight} className="font-sans text-cream/60 leading-relaxed mb-4">
            MJ Grand Hotel was established with a clear vision — to redefine luxury hospitality by combining modern elegance with warm, attentive service. Every detail of our hotel has been thoughtfully designed to provide guests with a seamless and elevated experience.
          </motion.p>
          <motion.p variants={slideFromLeft} className="font-sans text-cream/50 leading-relaxed">
            From our tastefully furnished interiors to our professional and courteous staff, we pride ourselves on creating an atmosphere where guests feel valued, relaxed, and truly at home.
          </motion.p>
        </motion.div>
      </section>

      {/* Elegant Accommodation */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">Elegant Accommodation</h2>
            <div className="w-12 h-[2px] bg-gold mx-auto mb-6" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="font-sans text-cream/60 max-w-2xl mx-auto leading-relaxed"
            >
              Our luxury rooms and suites are designed to provide the perfect balance of comfort and style.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            {roomFeatures.map((feature, i) => {
              const isLeft = i % 3 === 0 || (i % 2 === 0);
              return (
                <motion.div
                  key={i}
                  variants={isLeft ? slideFromLeft : slideFromRight}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: "tween", duration: 0.25, ease }}
                  className="flex items-center gap-4 p-5 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300"
                >
                  <feature.icon size={20} className="text-gold shrink-0" />
                  <span className="font-sans text-sm text-cream/70">{feature.text}</span>
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
            Every space reflects our dedication to comfort, privacy, and sophistication.
          </motion.p>
        </div>
      </section>

      {/* Facilities & Services */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">Exceptional Facilities & Services</h2>
            <div className="w-12 h-[2px] bg-gold mx-auto mb-6" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="font-sans text-cream/60 max-w-2xl mx-auto leading-relaxed"
            >
              At MJ Grand Hotel, we go beyond accommodation to provide a complete hospitality experience.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto"
          >
            {facilities.map((facility, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={i}
                  variants={isLeft ? slideFromLeft : slideFromRight}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: "tween", duration: 0.25, ease }}
                  className="flex items-center gap-4 p-5 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300"
                >
                  <facility.icon size={20} className="text-gold shrink-0" />
                  <span className="font-sans text-sm text-cream/70">{facility.text}</span>
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
            Whether hosting a corporate event, wedding reception, or private celebration, we provide the perfect setting.
          </motion.p>
        </div>
      </section>

      {/* Commitment to Excellence */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2 variants={slideFromLeft} className="font-serif text-3xl md:text-4xl text-cream mb-4">
              Our Commitment to Excellence
            </motion.h2>
            <motion.div variants={fadeIn} className="w-12 h-[2px] bg-gold mx-auto mb-8" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="font-sans text-cream/60 leading-relaxed mb-4"
            >
              Our mission is simple: to provide exceptional luxury hospitality defined by comfort, security, and impeccable service. We are committed to maintaining the highest standards of cleanliness, professionalism, and guest satisfaction.
            </motion.p>
            <motion.p variants={slideFromLeft} className="font-sans text-gold/80 font-medium italic">
              At MJ Grand Hotel, your comfort is our priority, and your experience is our promise.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="border-t border-cream/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease }}
            className="text-center mb-14"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">Core Values & Behaviors</h2>
            <div className="w-12 h-[2px] bg-gold mx-auto mb-6" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="font-sans text-cream/60 max-w-2xl mx-auto leading-relaxed"
            >
              At MJ Grand Hotel, our culture is shaped by principles that guide our service delivery and define our standard of excellence.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto"
          >
            {coreValues.map((value, i) => {
              const col = i % 3;
              const variant = col === 0 ? slideFromLeft : col === 2 ? slideFromRight : fadeUp;
              return (
                <motion.div
                  key={i}
                  variants={variant}
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: "tween", duration: 0.25, ease }}
                  className="p-6 rounded-xl border border-cream/5 bg-cream/[0.02] hover:bg-cream/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-colors duration-300"
                >
                  <value.icon size={24} className="text-gold mb-4" />
                  <h3 className="font-serif text-lg text-cream font-semibold">{value.title}</h3>
                  {value.subtitle && (
                    <p className="font-sans text-[11px] uppercase tracking-wider text-gold/60 mt-1 mb-3">{value.subtitle}</p>
                  )}
                  <p className="font-sans text-sm text-cream/50 leading-relaxed mt-2">{value.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
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
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">Discover True Hospitality</h2>
            <div className="w-12 h-[2px] bg-gold mx-auto mb-6" />
            <p className="font-sans text-cream/60 leading-relaxed mb-8">
              We invite you to experience the elegance, tranquility, and superior service that define MJ Grand Hotel. Book your stay with us today and discover a new standard of luxury living.
            </p>
            <Link
              to="/booking"
              className="inline-block bg-gold px-8 py-3.5 font-sans text-sm font-semibold uppercase tracking-wider text-charcoal hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
            >
              Book Your Stay
            </Link>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default About;
