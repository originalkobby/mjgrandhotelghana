import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ContactForm = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        full_name: name.trim(),
        email: phone.trim() || "N/A",
        message: message.trim(),
      });

      if (error) throw error;

      toast({
        title: "Inquiry sent",
        description: "Our concierge will respond shortly.",
      });
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-secondary py-24 md:py-32">
      <div className="container mx-auto px-6 lg:px-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          >
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-gold mb-6 font-bold">
              Contact
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] text-foreground leading-[1.1] mb-8">
              Private Inquiries
            </h2>
            <p className="font-sans text-muted-foreground leading-relaxed max-w-md mb-12">
              Whether reserving a suite, planning an event, or simply seeking
              guidance — our concierge awaits your request with the utmost
              discretion.
            </p>

            <div className="space-y-2 font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground">
              <p>No. 460 Abotsi Street, East Legon, Accra</p>
              <p>Tel: +233 302 544 212</p>
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.3, 0, 0.2, 1] }}
            onSubmit={handleSubmit}
            className="space-y-8 pt-2"
          >
            <div>
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground block mb-3">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b border-border pb-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold transition-colors font-sans"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground block mb-3">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent border-b border-border pb-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold transition-colors font-sans"
                maxLength={20}
              />
            </div>

            <div>
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground block mb-3">
                Your Message
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-transparent border-b border-border pb-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold transition-colors resize-none font-sans"
                required
                maxLength={1000}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full border border-gold px-8 py-4 text-xs tracking-[0.2em] uppercase font-sans text-gold hover:bg-gold hover:text-charcoal transition-colors duration-300 disabled:opacity-50 mt-4"
            >
              {submitting ? "Sending…" : "Send Inquiry"}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
