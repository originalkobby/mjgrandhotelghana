import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/logo.png";

const Contact = () => {
  return (
    <div className="min-h-screen bg-secondary">
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

      <div className="container mx-auto px-6 lg:px-12 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.3, 0, 0.2, 1] }}
            className="font-serif text-4xl md:text-5xl text-foreground mb-4"
          >
            Get In Touch
          </motion.h1>
          <div className="w-20 h-[2px] bg-gold mx-auto mb-4" />
          <p className="font-sans text-muted-foreground max-w-xl mx-auto">
            We'd love to hear from you. Reach out for reservations, enquiries, or feedback.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.3, 0, 0.2, 1] }}
            className="space-y-8"
          >
            <div className="bg-card border border-border rounded-lg p-8">
              <motion.h2
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.3, 0, 0.2, 1] }}
                className="font-serif text-2xl text-foreground mb-6"
              >
                Contact Information
              </motion.h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">Phone</p>
                    <p className="font-sans text-sm text-muted-foreground">0573338062</p>
                    <p className="font-sans text-sm text-muted-foreground">0531024536</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">Email</p>
                    <p className="font-sans text-sm text-muted-foreground">mj@mjgrandhotel.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">Address</p>
                    <p className="font-sans text-sm text-muted-foreground">MJ Grand Hotel, Ghana</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <motion.h3
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.3, 0, 0.2, 1] }}
                className="font-serif text-lg text-foreground mb-4"
              >
                Follow Us
              </motion.h3>
              <div className="flex gap-4">
                <a href="https://instagram.com/MJGRAND_HOTEL" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors font-sans text-sm">
                  <Instagram size={18} /> @MJGRAND_HOTEL
                </a>
                <a href="https://facebook.com/MJGrandHotel" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors font-sans text-sm">
                  <Facebook size={18} /> MJ Grand Hotel
                </a>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.3, 0, 0.2, 1] }}
            className="bg-card border border-border rounded-lg p-8"
          >
            <motion.h2
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.3, 0, 0.2, 1] }}
              className="font-serif text-2xl text-foreground mb-6"
            >
              Send a Message
            </motion.h2>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="font-sans text-sm text-muted-foreground block mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors font-sans"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-muted-foreground block mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors font-sans"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-muted-foreground block mb-1.5">Message</label>
                <textarea
                  rows={5}
                  className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors resize-none font-sans"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gold px-6 py-3 text-sm font-sans font-semibold text-charcoal hover:bg-gold-light transition-colors duration-300 rounded-md"
              >
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
