import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    <div className="container grid gap-10 py-16 md:grid-cols-4">
      <div className="md:col-span-2">
        <p className="font-serif text-2xl">
          MJ <span className="text-accent">Grand</span> Hotel
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
          A refined address in East Legon, Accra — where quiet luxury, warm Ghanaian
          hospitality and considered detail meet.
        </p>
        <div className="mt-6 flex gap-4">
          <a href="https://instagram.com" aria-label="Instagram" className="text-primary-foreground/70 hover:text-accent">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="https://facebook.com" aria-label="Facebook" className="text-primary-foreground/70 hover:text-accent">
            <Facebook className="h-5 w-5" />
          </a>
        </div>
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-[0.22em] text-accent">Explore</h2>
        <ul className="mt-5 space-y-3 text-sm text-primary-foreground/70">
          <li><Link to="/booking" className="hover:text-accent">Reservations</Link></li>
          <li><Link to="/dining" className="hover:text-accent">Dining</Link></li>
          <li><Link to="/gallery" className="hover:text-accent">Gallery</Link></li>
          <li><Link to="/guest-services" className="hover:text-accent">Guest Services</Link></li>
          <li><Link to="/policy" className="hover:text-accent">Policies</Link></li>
        </ul>
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-[0.22em] text-accent">Contact</h2>
        <ul className="mt-5 space-y-3 text-sm text-primary-foreground/70">
          <li className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-accent" />East Legon, Accra, Ghana</li>
          <li className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-accent" />+233 30 000 0000</li>
          <li className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-accent" />info@mjgrandhotelghana.com</li>
        </ul>
      </div>
    </div>

    <div className="border-t border-primary-foreground/10">
      <div className="container flex flex-col gap-2 py-6 text-xs text-primary-foreground/50 md:flex-row md:justify-between">
        <p>&copy; {new Date().getFullYear()} MJ Grand Hotel Ghana. All rights reserved.</p>
        <Link to="/admin" className="hover:text-accent">Staff Portal</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
