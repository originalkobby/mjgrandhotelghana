import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import logo from "@/assets/logo.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, user, role, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      navigate("/admin", { replace: true });
    }
  }, [loading, user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const err = await signIn(email, password);
      if (err) {
        setError(err);
      } else {
        navigate("/admin", { replace: true });
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Sign in error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Top band — mirrors the public navbar */}
      <header className="bg-admin-bar h-[72px] flex items-center px-6 lg:px-16">
        <img src={logo} alt="MJ Grand Hotel" className="h-9 w-auto" />
        <span className="ml-auto font-sans text-[0.7rem] tracking-[0.25em] uppercase text-admin-bar-foreground/90">
          Reservation Portal
        </span>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-6 lg:px-16 max-w-6xl py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Left — editorial copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.3, 0, 0.2, 1] }}
            >
              <p className="font-sans text-xs tracking-[0.25em] uppercase text-gold mb-6 font-bold">
                Reservation Portal
              </p>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] text-foreground leading-[1.1] mb-8">
                Booking
                <br />
                Command Center
              </h1>
              <p className="font-sans text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
                Secure access for MJ Grand Hotel staff — reservations, inventory,
                guests and revenue, all in one discreet place.
              </p>

              <div className="mt-12 space-y-2 font-sans text-sm tracking-[0.12em] uppercase text-muted-foreground">
                <p>No. 460 Abotsi Street, East Legon, Accra</p>
                <p>Tel: +233 302 544 212</p>
              </div>
            </motion.div>

            {/* Right — form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.3, 0, 0.2, 1] }}
              className="w-full space-y-10"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent border-0 border-b border-border pb-3 font-sans text-base text-foreground outline-none transition-colors focus:border-gold placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-transparent border-0 border-b border-border pb-3 pr-10 font-sans text-base text-foreground outline-none transition-colors focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-0 bottom-3 text-muted-foreground transition-colors hover:text-gold"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="font-sans text-sm text-destructive">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full border border-gold py-5 font-sans text-sm tracking-[0.25em] uppercase text-gold transition-colors hover:bg-gold hover:text-cream disabled:opacity-60"
              >
                {submitting ? "Signing In…" : "Sign In"}
              </button>

              <p className="font-sans text-xs tracking-[0.12em] uppercase text-muted-foreground">
                Contact your administrator if you need access
              </p>
            </motion.form>
          </div>
        </div>
      </main>
    </div>
  );
}
