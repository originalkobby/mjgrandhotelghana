import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { GuestInfo, SelectedRoom, SelectedAddOn } from "@/hooks/useBooking";

const COUNTRY_CODES = [
  { code: "+233", flag: "🇬🇭", country: "Ghana" },
  { code: "+234", flag: "🇳🇬", country: "Nigeria" },
  { code: "+254", flag: "🇰🇪", country: "Kenya" },
  { code: "+27", flag: "🇿🇦", country: "South Africa" },
  { code: "+225", flag: "🇨🇮", country: "Côte d'Ivoire" },
  { code: "+228", flag: "🇹🇬", country: "Togo" },
  { code: "+229", flag: "🇧🇯", country: "Benin" },
  { code: "+226", flag: "🇧🇫", country: "Burkina Faso" },
  { code: "+1", flag: "🇺🇸", country: "United States" },
  { code: "+44", flag: "🇬🇧", country: "United Kingdom" },
  { code: "+49", flag: "🇩🇪", country: "Germany" },
  { code: "+33", flag: "🇫🇷", country: "France" },
  { code: "+39", flag: "🇮🇹", country: "Italy" },
  { code: "+34", flag: "🇪🇸", country: "Spain" },
  { code: "+31", flag: "🇳🇱", country: "Netherlands" },
  { code: "+46", flag: "🇸🇪", country: "Sweden" },
  { code: "+41", flag: "🇨🇭", country: "Switzerland" },
  { code: "+86", flag: "🇨🇳", country: "China" },
  { code: "+91", flag: "🇮🇳", country: "India" },
  { code: "+81", flag: "🇯🇵", country: "Japan" },
  { code: "+82", flag: "🇰🇷", country: "South Korea" },
  { code: "+971", flag: "🇦🇪", country: "UAE" },
  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "+61", flag: "🇦🇺", country: "Australia" },
  { code: "+55", flag: "🇧🇷", country: "Brazil" },
  { code: "+52", flag: "🇲🇽", country: "Mexico" },
  { code: "+20", flag: "🇪🇬", country: "Egypt" },
  { code: "+212", flag: "🇲🇦", country: "Morocco" },
  { code: "+255", flag: "🇹🇿", country: "Tanzania" },
  { code: "+256", flag: "🇺🇬", country: "Uganda" },
  { code: "+237", flag: "🇨🇲", country: "Cameroon" },
  { code: "+221", flag: "🇸🇳", country: "Senegal" },
  { code: "+251", flag: "🇪🇹", country: "Ethiopia" },
  { code: "+260", flag: "🇿🇲", country: "Zambia" },
  { code: "+263", flag: "🇿🇼", country: "Zimbabwe" },
];

interface Props {
  guestInfo: GuestInfo;
  selectedRoom: SelectedRoom;
  selectedAddOns: SelectedAddOn[];
  totalAmount: number;
  onUpdate: (info: Partial<GuestInfo>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function GuestDetailsStep({
  guestInfo,
  selectedRoom,
  selectedAddOns,
  totalAmount,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}: Props) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState(() => {
    // Extract number part if phone already has a country code
    const existing = guestInfo.phone;
    if (existing) {
      const match = COUNTRY_CODES.find((c) => existing.startsWith(c.code));
      if (match) {
        setSelectedCountry(match);
        return existing.slice(match.code.length).trim();
      }
      return existing;
    }
    return "";
  });
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const handlePhoneChange = (num: string) => {
    setPhoneNumber(num);
    onUpdate({ phone: `${selectedCountry.code} ${num}` });
  };

  const handleCountrySelect = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setCountryOpen(false);
    setCountrySearch("");
    onUpdate({ phone: `${country.code} ${phoneNumber}` });
  };

  const filteredCountries = countrySearch
    ? COUNTRY_CODES.filter(
        (c) =>
          c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.includes(countrySearch)
      )
    : COUNTRY_CODES;

  const isValid =
    guestInfo.fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email) &&
    phoneNumber.trim().length >= 6;

  const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to extras
      </button>
      <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8">Guest Details</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Form */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <Input
                value={guestInfo.fullName}
                onChange={(e) => onUpdate({ fullName: e.target.value })}
                placeholder="John Doe"
                className="h-12"
              />
            </Field>
            <Field label="Email *">
              <Input
                type="email"
                value={guestInfo.email}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="john@example.com"
                className="h-12"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone *">
              <div className="flex gap-1.5">
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-12 px-3 border border-input rounded-md flex items-center gap-1.5 text-sm font-sans hover:bg-muted/50 transition-colors shrink-0"
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-muted-foreground">{selectedCountry.code}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start">
                    <div className="p-2 border-b border-border">
                      <Input
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country…"
                        className="h-8 text-xs"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCountries.map((c) => (
                        <button
                          key={c.code + c.country}
                          onClick={() => handleCountrySelect(c)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-sans hover:bg-muted/50 transition-colors ${
                            selectedCountry.code === c.code ? "bg-accent/10 text-accent" : ""
                          }`}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="flex-1 text-left">{c.country}</span>
                          <span className="text-muted-foreground text-xs">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="xxx xxx xxxx"
                  className="h-12 flex-1"
                />
              </div>
            </Field>
            <Field label="Nationality">
              <Input
                value={guestInfo.nationality}
                onChange={(e) => onUpdate({ nationality: e.target.value })}
                placeholder="e.g. Ghanaian"
                className="h-12"
              />
            </Field>
          </div>
          <Field label="Estimated Arrival Time">
            <Input
              value={guestInfo.arrivalTime}
              onChange={(e) => onUpdate({ arrivalTime: e.target.value })}
              placeholder="e.g. 3:00 PM"
              className="h-12"
            />
          </Field>
          <Field label="Special Requests">
            <Textarea
              value={guestInfo.specialRequests}
              onChange={(e) => onUpdate({ specialRequests: e.target.value })}
              placeholder="Any special requests for your stay..."
              className="min-h-[80px] resize-none"
            />
          </Field>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
            <span className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
              <Lock className="w-3.5 h-3.5" /> SSL Secured
            </span>
            <span className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
              <Shield className="w-3.5 h-3.5" /> Data Privacy Protected
            </span>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-24">
          <h3 className="font-serif text-lg text-foreground mb-4">Booking Summary</h3>

          <div className="space-y-3 text-sm font-sans">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{selectedRoom.name}</span>
              <span className="text-foreground font-medium">
                GH₵ {selectedRoom.nightlyRate.toLocaleString()} × {selectedRoom.totalNights}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room subtotal</span>
              <span className="text-foreground">GH₵ {selectedRoom.totalPrice.toLocaleString()}</span>
            </div>

            {selectedAddOns.length > 0 && (
              <>
                <div className="border-t border-border pt-3 mt-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Extras</p>
                  {selectedAddOns.map((a) => (
                    <div key={a.id} className="flex justify-between py-0.5">
                      <span className="text-muted-foreground">{a.name}</span>
                      <span className="text-foreground">GH₵ {a.price_ghs.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="border-t border-border pt-3 mt-3 flex justify-between font-semibold text-base">
              <span className="text-foreground">Total</span>
              <span className="text-accent">GH₵ {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <Button
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full mt-6 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-sans text-sm font-semibold uppercase tracking-wider"
          >
            {isSubmitting ? "Processing..." : "Confirm Booking"}
          </Button>

          <p className="text-center text-xs font-sans text-muted-foreground mt-3">
            You will not be charged until confirmation.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
