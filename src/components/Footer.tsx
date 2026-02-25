import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer id="contact" className="bg-charcoal py-20">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.3, 0, 0.2, 1] }}
        className="container mx-auto px-6 lg:px-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand + contact */}
          <div>
            <img src={logo} alt="MJ Grand Hotel" className="h-11 w-auto mb-4" />
            <div className="space-y-3 text-sm font-sans text-cream/60">
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-gold" />
                123 Paradise Boulevard, Coastal City
              </p>
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-gold" />
                +1 (555) 123-4567
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-gold" />
                reservations@mjgrand.com
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider text-cream/40 mb-6">
              Quick Links
            </h4>
            <div className="space-y-3 font-sans text-sm">
              {["Rooms & Suites", "Dining", "Spa & Wellness", "Events", "Careers"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-cream/60 hover:text-gold transition-colors duration-300"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider text-cream/40 mb-6">
              Stay Connected
            </h4>
            <p className="font-sans text-sm text-cream/60 mb-4">
              Receive exclusive offers and updates from MJ Grand.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-cream/5 border border-cream/10 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
                aria-label="Email for newsletter"
              />
              <button className="bg-gold px-5 py-2.5 text-sm font-sans font-semibold text-charcoal hover:bg-gold-light transition-colors duration-300">
                Join
              </button>
            </div>
            {/* Social */}
            <div className="flex gap-4 mt-6">
              {["Instagram", "Facebook", "Twitter"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="text-xs font-sans text-cream/40 hover:text-gold hover:scale-110 transition-all duration-300"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-cream/10 text-center">
          <p className="font-sans text-xs text-cream/30">
            © 2026 MJ Grand Hotel. All rights reserved.
          </p>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
