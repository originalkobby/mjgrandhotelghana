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
  { code: "+93", flag: "🇦🇫", country: "Afghanistan" },
  { code: "+355", flag: "🇦🇱", country: "Albania" },
  { code: "+213", flag: "🇩🇿", country: "Algeria" },
  { code: "+376", flag: "🇦🇩", country: "Andorra" },
  { code: "+244", flag: "🇦🇴", country: "Angola" },
  { code: "+1268", flag: "🇦🇬", country: "Antigua & Barbuda" },
  { code: "+54", flag: "🇦🇷", country: "Argentina" },
  { code: "+374", flag: "🇦🇲", country: "Armenia" },
  { code: "+61", flag: "🇦🇺", country: "Australia" },
  { code: "+43", flag: "🇦🇹", country: "Austria" },
  { code: "+994", flag: "🇦🇿", country: "Azerbaijan" },
  { code: "+1242", flag: "🇧🇸", country: "Bahamas" },
  { code: "+973", flag: "🇧🇭", country: "Bahrain" },
  { code: "+880", flag: "🇧🇩", country: "Bangladesh" },
  { code: "+1246", flag: "🇧🇧", country: "Barbados" },
  { code: "+375", flag: "🇧🇾", country: "Belarus" },
  { code: "+32", flag: "🇧🇪", country: "Belgium" },
  { code: "+501", flag: "🇧🇿", country: "Belize" },
  { code: "+229", flag: "🇧🇯", country: "Benin" },
  { code: "+975", flag: "🇧🇹", country: "Bhutan" },
  { code: "+591", flag: "🇧🇴", country: "Bolivia" },
  { code: "+387", flag: "🇧🇦", country: "Bosnia" },
  { code: "+267", flag: "🇧🇼", country: "Botswana" },
  { code: "+55", flag: "🇧🇷", country: "Brazil" },
  { code: "+673", flag: "🇧🇳", country: "Brunei" },
  { code: "+359", flag: "🇧🇬", country: "Bulgaria" },
  { code: "+226", flag: "🇧🇫", country: "Burkina Faso" },
  { code: "+257", flag: "🇧🇮", country: "Burundi" },
  { code: "+855", flag: "🇰🇭", country: "Cambodia" },
  { code: "+237", flag: "🇨🇲", country: "Cameroon" },
  { code: "+1", flag: "🇨🇦", country: "Canada" },
  { code: "+238", flag: "🇨🇻", country: "Cape Verde" },
  { code: "+236", flag: "🇨🇫", country: "Central African Rep." },
  { code: "+235", flag: "🇹🇩", country: "Chad" },
  { code: "+56", flag: "🇨🇱", country: "Chile" },
  { code: "+86", flag: "🇨🇳", country: "China" },
  { code: "+57", flag: "🇨🇴", country: "Colombia" },
  { code: "+269", flag: "🇰🇲", country: "Comoros" },
  { code: "+242", flag: "🇨🇬", country: "Congo" },
  { code: "+243", flag: "🇨🇩", country: "DR Congo" },
  { code: "+506", flag: "🇨🇷", country: "Costa Rica" },
  { code: "+225", flag: "🇨🇮", country: "Côte d'Ivoire" },
  { code: "+385", flag: "🇭🇷", country: "Croatia" },
  { code: "+53", flag: "🇨🇺", country: "Cuba" },
  { code: "+357", flag: "🇨🇾", country: "Cyprus" },
  { code: "+420", flag: "🇨🇿", country: "Czech Republic" },
  { code: "+45", flag: "🇩🇰", country: "Denmark" },
  { code: "+253", flag: "🇩🇯", country: "Djibouti" },
  { code: "+593", flag: "🇪🇨", country: "Ecuador" },
  { code: "+20", flag: "🇪🇬", country: "Egypt" },
  { code: "+503", flag: "🇸🇻", country: "El Salvador" },
  { code: "+240", flag: "🇬🇶", country: "Equatorial Guinea" },
  { code: "+291", flag: "🇪🇷", country: "Eritrea" },
  { code: "+372", flag: "🇪🇪", country: "Estonia" },
  { code: "+268", flag: "🇸🇿", country: "Eswatini" },
  { code: "+251", flag: "🇪🇹", country: "Ethiopia" },
  { code: "+679", flag: "🇫🇯", country: "Fiji" },
  { code: "+358", flag: "🇫🇮", country: "Finland" },
  { code: "+33", flag: "🇫🇷", country: "France" },
  { code: "+241", flag: "🇬🇦", country: "Gabon" },
  { code: "+220", flag: "🇬🇲", country: "Gambia" },
  { code: "+995", flag: "🇬🇪", country: "Georgia" },
  { code: "+49", flag: "🇩🇪", country: "Germany" },
  { code: "+233", flag: "🇬🇭", country: "Ghana" },
  { code: "+30", flag: "🇬🇷", country: "Greece" },
  { code: "+502", flag: "🇬🇹", country: "Guatemala" },
  { code: "+224", flag: "🇬🇳", country: "Guinea" },
  { code: "+592", flag: "🇬🇾", country: "Guyana" },
  { code: "+509", flag: "🇭🇹", country: "Haiti" },
  { code: "+504", flag: "🇭🇳", country: "Honduras" },
  { code: "+852", flag: "🇭🇰", country: "Hong Kong" },
  { code: "+36", flag: "🇭🇺", country: "Hungary" },
  { code: "+354", flag: "🇮🇸", country: "Iceland" },
  { code: "+91", flag: "🇮🇳", country: "India" },
  { code: "+62", flag: "🇮🇩", country: "Indonesia" },
  { code: "+98", flag: "🇮🇷", country: "Iran" },
  { code: "+964", flag: "🇮🇶", country: "Iraq" },
  { code: "+353", flag: "🇮🇪", country: "Ireland" },
  { code: "+972", flag: "🇮🇱", country: "Israel" },
  { code: "+39", flag: "🇮🇹", country: "Italy" },
  { code: "+1876", flag: "🇯🇲", country: "Jamaica" },
  { code: "+81", flag: "🇯🇵", country: "Japan" },
  { code: "+962", flag: "🇯🇴", country: "Jordan" },
  { code: "+7", flag: "🇰🇿", country: "Kazakhstan" },
  { code: "+254", flag: "🇰🇪", country: "Kenya" },
  { code: "+965", flag: "🇰🇼", country: "Kuwait" },
  { code: "+996", flag: "🇰🇬", country: "Kyrgyzstan" },
  { code: "+856", flag: "🇱🇦", country: "Laos" },
  { code: "+371", flag: "🇱🇻", country: "Latvia" },
  { code: "+961", flag: "🇱🇧", country: "Lebanon" },
  { code: "+266", flag: "🇱🇸", country: "Lesotho" },
  { code: "+231", flag: "🇱🇷", country: "Liberia" },
  { code: "+218", flag: "🇱🇾", country: "Libya" },
  { code: "+370", flag: "🇱🇹", country: "Lithuania" },
  { code: "+352", flag: "🇱🇺", country: "Luxembourg" },
  { code: "+261", flag: "🇲🇬", country: "Madagascar" },
  { code: "+265", flag: "🇲🇼", country: "Malawi" },
  { code: "+60", flag: "🇲🇾", country: "Malaysia" },
  { code: "+960", flag: "🇲🇻", country: "Maldives" },
  { code: "+223", flag: "🇲🇱", country: "Mali" },
  { code: "+356", flag: "🇲🇹", country: "Malta" },
  { code: "+222", flag: "🇲🇷", country: "Mauritania" },
  { code: "+230", flag: "🇲🇺", country: "Mauritius" },
  { code: "+52", flag: "🇲🇽", country: "Mexico" },
  { code: "+373", flag: "🇲🇩", country: "Moldova" },
  { code: "+377", flag: "🇲🇨", country: "Monaco" },
  { code: "+976", flag: "🇲🇳", country: "Mongolia" },
  { code: "+382", flag: "🇲🇪", country: "Montenegro" },
  { code: "+212", flag: "🇲🇦", country: "Morocco" },
  { code: "+258", flag: "🇲🇿", country: "Mozambique" },
  { code: "+95", flag: "🇲🇲", country: "Myanmar" },
  { code: "+264", flag: "🇳🇦", country: "Namibia" },
  { code: "+977", flag: "🇳🇵", country: "Nepal" },
  { code: "+31", flag: "🇳🇱", country: "Netherlands" },
  { code: "+64", flag: "🇳🇿", country: "New Zealand" },
  { code: "+505", flag: "🇳🇮", country: "Nicaragua" },
  { code: "+227", flag: "🇳🇪", country: "Niger" },
  { code: "+234", flag: "🇳🇬", country: "Nigeria" },
  { code: "+850", flag: "🇰🇵", country: "North Korea" },
  { code: "+389", flag: "🇲🇰", country: "North Macedonia" },
  { code: "+47", flag: "🇳🇴", country: "Norway" },
  { code: "+968", flag: "🇴🇲", country: "Oman" },
  { code: "+92", flag: "🇵🇰", country: "Pakistan" },
  { code: "+507", flag: "🇵🇦", country: "Panama" },
  { code: "+675", flag: "🇵🇬", country: "Papua New Guinea" },
  { code: "+595", flag: "🇵🇾", country: "Paraguay" },
  { code: "+51", flag: "🇵🇪", country: "Peru" },
  { code: "+63", flag: "🇵🇭", country: "Philippines" },
  { code: "+48", flag: "🇵🇱", country: "Poland" },
  { code: "+351", flag: "🇵🇹", country: "Portugal" },
  { code: "+974", flag: "🇶🇦", country: "Qatar" },
  { code: "+40", flag: "🇷🇴", country: "Romania" },
  { code: "+7", flag: "🇷🇺", country: "Russia" },
  { code: "+250", flag: "🇷🇼", country: "Rwanda" },
  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "+221", flag: "🇸🇳", country: "Senegal" },
  { code: "+381", flag: "🇷🇸", country: "Serbia" },
  { code: "+248", flag: "🇸🇨", country: "Seychelles" },
  { code: "+232", flag: "🇸🇱", country: "Sierra Leone" },
  { code: "+65", flag: "🇸🇬", country: "Singapore" },
  { code: "+421", flag: "🇸🇰", country: "Slovakia" },
  { code: "+386", flag: "🇸🇮", country: "Slovenia" },
  { code: "+252", flag: "🇸🇴", country: "Somalia" },
  { code: "+27", flag: "🇿🇦", country: "South Africa" },
  { code: "+82", flag: "🇰🇷", country: "South Korea" },
  { code: "+211", flag: "🇸🇸", country: "South Sudan" },
  { code: "+34", flag: "🇪🇸", country: "Spain" },
  { code: "+94", flag: "🇱🇰", country: "Sri Lanka" },
  { code: "+249", flag: "🇸🇩", country: "Sudan" },
  { code: "+597", flag: "🇸🇷", country: "Suriname" },
  { code: "+46", flag: "🇸🇪", country: "Sweden" },
  { code: "+41", flag: "🇨🇭", country: "Switzerland" },
  { code: "+963", flag: "🇸🇾", country: "Syria" },
  { code: "+886", flag: "🇹🇼", country: "Taiwan" },
  { code: "+992", flag: "🇹🇯", country: "Tajikistan" },
  { code: "+255", flag: "🇹🇿", country: "Tanzania" },
  { code: "+66", flag: "🇹🇭", country: "Thailand" },
  { code: "+228", flag: "🇹🇬", country: "Togo" },
  { code: "+1868", flag: "🇹🇹", country: "Trinidad & Tobago" },
  { code: "+216", flag: "🇹🇳", country: "Tunisia" },
  { code: "+90", flag: "🇹🇷", country: "Turkey" },
  { code: "+993", flag: "🇹🇲", country: "Turkmenistan" },
  { code: "+256", flag: "🇺🇬", country: "Uganda" },
  { code: "+380", flag: "🇺🇦", country: "Ukraine" },
  { code: "+971", flag: "🇦🇪", country: "UAE" },
  { code: "+44", flag: "🇬🇧", country: "United Kingdom" },
  { code: "+1", flag: "🇺🇸", country: "United States" },
  { code: "+598", flag: "🇺🇾", country: "Uruguay" },
  { code: "+998", flag: "🇺🇿", country: "Uzbekistan" },
  { code: "+58", flag: "🇻🇪", country: "Venezuela" },
  { code: "+84", flag: "🇻🇳", country: "Vietnam" },
  { code: "+967", flag: "🇾🇪", country: "Yemen" },
  { code: "+260", flag: "🇿🇲", country: "Zambia" },
  { code: "+263", flag: "🇿🇼", country: "Zimbabwe" },
];

// Default to Ghana
const DEFAULT_COUNTRY = COUNTRY_CODES.find((c) => c.country === "Ghana") || COUNTRY_CODES[0];

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
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const existing = guestInfo.phone;
    if (existing) {
      const match = COUNTRY_CODES.find((c) => existing.startsWith(c.code));
      if (match) return match;
    }
    return DEFAULT_COUNTRY;
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    const existing = guestInfo.phone;
    if (existing) {
      const match = COUNTRY_CODES.find((c) => existing.startsWith(c.code));
      if (match) return existing.slice(match.code.length).trim();
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
                            selectedCountry.code === c.code && selectedCountry.country === c.country ? "bg-accent/10 text-accent" : ""
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