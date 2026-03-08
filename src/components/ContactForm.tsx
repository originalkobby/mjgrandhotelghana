import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        full_name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "We'll get back to you shortly.",
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-secondary py-20">
      <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
            Get In Touch
          </h2>
          <div className="w-16 h-[2px] bg-gold mx-auto mb-4" />
          <p className="font-sans text-muted-foreground">
            Reach out for reservations, enquiries, or feedback.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.3, 0, 0.2, 1] }}
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-8 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="font-sans text-sm text-muted-foreground block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors font-sans"
                placeholder="Your name"
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="font-sans text-sm text-muted-foreground block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors font-sans"
                placeholder="your@email.com"
                required
                maxLength={255}
              />
            </div>
          </div>
          <div>
            <label className="font-sans text-sm text-muted-foreground block mb-1.5">
              Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors resize-none font-sans"
              placeholder="How can we help you?"
              required
              maxLength={1000}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gold px-6 py-3 text-sm font-sans font-semibold text-charcoal hover:bg-gold-light transition-colors duration-300 rounded-md disabled:opacity-50"
          >
            <Send size={16} />
            {submitting ? "Sending…" : "Send Message"}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactForm;
