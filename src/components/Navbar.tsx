import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Rooms & Suites", href: "#rooms" },
  { label: "Experiences", href: "#experiences" },
  { label: "Dining", href: "#dining" },
  { label: "Gallery", href: "#gallery" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-nav py-3 shadow-lg" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 lg:px-12">
          <a href="#home" className="font-serif text-2xl tracking-wider text-cream">
            MJ Grand
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative text-sm font-sans font-medium tracking-wide text-cream/80 hover:text-cream transition-colors duration-300"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-gold transition-all duration-300 ease-[cubic-bezier(0.3,0,0.2,1)] group-hover:w-full" />
              </a>
            ))}
            <a
              href="#contact"
              className="ml-2 border border-gold/60 px-5 py-2 text-sm font-sans font-medium tracking-wide text-cream hover:bg-gold hover:text-charcoal transition-all duration-300"
            >
              Book Now
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-cream"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-overlay-heavy"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.3, 0, 0.2, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-80 bg-charcoal flex flex-col p-8"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="self-end text-cream mb-12"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
              <div className="flex flex-col gap-6">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="font-serif text-2xl text-cream/80 hover:text-gold transition-colors duration-300"
                  >
                    {item.label}
                  </motion.a>
                ))}
                <motion.a
                  href="#contact"
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 border border-gold/60 px-5 py-3 text-center font-sans font-medium tracking-wide text-cream hover:bg-gold hover:text-charcoal transition-all duration-300"
                >
                  Book Now
                </motion.a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
