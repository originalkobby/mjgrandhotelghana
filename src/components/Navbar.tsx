import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/dining", label: "Dining" },
  { to: "/menu", label: "Menu" },
  { to: "/gallery", label: "Gallery" },
  { to: "/guest-services", label: "Guest Services" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border py-3"
          : "bg-gradient-to-b from-black/50 to-transparent py-5"
      )}
    >
      <div className="container flex items-center justify-between">
        <Link
          to="/"
          className={cn(
            "font-serif text-xl md:text-2xl tracking-wide transition-colors",
            scrolled ? "text-foreground" : "text-white"
          )}
        >
          MJ <span className="text-accent">Grand</span> Hotel
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "text-sm tracking-wide transition-colors hover:text-accent",
                  scrolled ? "text-muted-foreground" : "text-white/85",
                  isActive && "text-accent"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/booking"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.03]"
          >
            Book Now
          </Link>
        </nav>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className={cn("lg:hidden", scrolled ? "text-foreground" : "text-white")}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden mt-3 border-t border-border bg-background px-6 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block text-sm text-muted-foreground hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/booking"
            onClick={() => setOpen(false)}
            className="block rounded-full bg-accent px-6 py-2.5 text-center text-sm font-medium text-accent-foreground"
          >
            Book Now
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
