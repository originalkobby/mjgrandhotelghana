import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, ChevronDown } from "lucide-react";
import FlagIcon from "@/components/FlagIcon";
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
  { code: "+93", iso: "af", country: "Afghanistan" },
  { code: "+355", iso: "al", country: "Albania" },
  { code: "+213", iso: "dz", country: "Algeria" },
  { code: "+376", iso: "ad", country: "Andorra" },
  { code: "+244", iso: "ao", country: "Angola" },
  { code: "+1268", iso: "ag", country: "Antigua & Barbuda" },
  { code: "+54", iso: "ar", country: "Argentina" },
  { code: "+374", iso: "am", country: "Armenia" },
  { code: "+61", iso: "au", country: "Australia" },
  { code: "+43", iso: "at", country: "Austria" },
  { code: "+994", iso: "az", country: "Azerbaijan" },
  { code: "+1242", iso: "bs", country: "Bahamas" },
  { code: "+973", iso: "bh", country: "Bahrain" },
  { code: "+880", iso: "bd", country: "Bangladesh" },
  { code: "+1246", iso: "bb", country: "Barbados" },
  { code: "+375", iso: "by", country: "Belarus" },
  { code: "+32", iso: "be", country: "Belgium" },
  { code: "+501", iso: "bz", country: "Belize" },
  { code: "+229", iso: "bj", country: "Benin" },
  { code: "+975", iso: "bt", country: "Bhutan" },
  { code: "+591", iso: "bo", country: "Bolivia" },
  { code: "+387", iso: "ba", country: "Bosnia" },
  { code: "+267", iso: "bw", country: "Botswana" },
  { code: "+55", iso: "br", country: "Brazil" },
  { code: "+673", iso: "bn", country: "Brunei" },
  { code: "+359", iso: "bg", country: "Bulgaria" },
  { code: "+226", iso: "bf", country: "Burkina Faso" },
  { code: "+257", iso: "bi", country: "Burundi" },
  { code: "+855", iso: "kh", country: "Cambodia" },
  { code: "+237", iso: "cm", country: "Cameroon" },
  { code: "+1", iso: "ca", country: "Canada" },
  { code: "+238", iso: "cv", country: "Cape Verde" },
  { code: "+236", iso: "cf", country: "Central African Rep." },
  { code: "+235", iso: "td", country: "Chad" },
  { code: "+56", iso: "cl", country: "Chile" },
  { code: "+86", iso: "cn", country: "China" },
  { code: "+57", iso: "co", country: "Colombia" },
  { code: "+269", iso: "km", country: "Comoros" },
  { code: "+242", iso: "cg", country: "Congo" },
  { code: "+243", iso: "cd", country: "DR Congo" },
  { code: "+506", iso: "cr", country: "Costa Rica" },
  { code: "+225", iso: "ci", country: "Côte d'Ivoire" },
  { code: "+385", iso: "hr", country: "Croatia" },
  { code: "+53", iso: "cu", country: "Cuba" },
  { code: "+357", iso: "cy", country: "Cyprus" },
  { code: "+420", iso: "cz", country: "Czech Republic" },
  { code: "+45", iso: "dk", country: "Denmark" },
  { code: "+253", iso: "dj", country: "Djibouti" },
  { code: "+593", iso: "ec", country: "Ecuador" },
  { code: "+20", iso: "eg", country: "Egypt" },
  { code: "+503", iso: "sv", country: "El Salvador" },
  { code: "+240", iso: "gq", country: "Equatorial Guinea" },
  { code: "+291", iso: "er", country: "Eritrea" },
  { code: "+372", iso: "ee", country: "Estonia" },
  { code: "+268", iso: "sz", country: "Eswatini" },
  { code: "+251", iso: "et", country: "Ethiopia" },
  { code: "+679", iso: "fj", country: "Fiji" },
  { code: "+358", iso: "fi", country: "Finland" },
  { code: "+33", iso: "fr", country: "France" },
  { code: "+241", iso: "ga", country: "Gabon" },
  { code: "+220", iso: "gm", country: "Gambia" },
  { code: "+995", iso: "ge", country: "Georgia" },
  { code: "+49", iso: "de", country: "Germany" },
  { code: "+233", iso: "gh", country: "Ghana" },
  { code: "+30", iso: "gr", country: "Greece" },
  { code: "+502", iso: "gt", country: "Guatemala" },
  { code: "+224", iso: "gn", country: "Guinea" },
  { code: "+592", iso: "gy", country: "Guyana" },
  { code: "+509", iso: "ht", country: "Haiti" },
  { code: "+504", iso: "hn", country: "Honduras" },
  { code: "+852", iso: "hk", country: "Hong Kong" },
  { code: "+36", iso: "hu", country: "Hungary" },
  { code: "+354", iso: "is", country: "Iceland" },
  { code: "+91", iso: "in", country: "India" },
  { code: "+62", iso: "id", country: "Indonesia" },
  { code: "+98", iso: "ir", country: "Iran" },
  { code: "+964", iso: "iq", country: "Iraq" },
  { code: "+353", iso: "ie", country: "Ireland" },
  { code: "+972", iso: "il", country: "Israel" },
  { code: "+39", iso: "it", country: "Italy" },
  { code: "+1876", iso: "jm", country: "Jamaica" },
  { code: "+81", iso: "jp", country: "Japan" },
  { code: "+962", iso: "jo", country: "Jordan" },
  { code: "+7", iso: "kz", country: "Kazakhstan" },
  { code: "+254", iso: "ke", country: "Kenya" },
  { code: "+965", iso: "kw", country: "Kuwait" },
  { code: "+996", iso: "kg", country: "Kyrgyzstan" },
  { code: "+856", iso: "la", country: "Laos" },
  { code: "+371", iso: "lv", country: "Latvia" },
  { code: "+961", iso: "lb", country: "Lebanon" },
  { code: "+266", iso: "ls", country: "Lesotho" },
  { code: "+231", iso: "lr", country: "Liberia" },
  { code: "+218", iso: "ly", country: "Libya" },
  { code: "+370", iso: "lt", country: "Lithuania" },
  { code: "+352", iso: "lu", country: "Luxembourg" },
  { code: "+261", iso: "mg", country: "Madagascar" },
  { code: "+265", iso: "mw", country: "Malawi" },
  { code: "+60", iso: "my", country: "Malaysia" },
  { code: "+960", iso: "mv", country: "Maldives" },
  { code: "+223", iso: "ml", country: "Mali" },
  { code: "+356", iso: "mt", country: "Malta" },
  { code: "+222", iso: "mr", country: "Mauritania" },
  { code: "+230", iso: "mu", country: "Mauritius" },
  { code: "+52", iso: "mx", country: "Mexico" },
  { code: "+373", iso: "md", country: "Moldova" },
  { code: "+377", iso: "mc", country: "Monaco" },
  { code: "+976", iso: "mn", country: "Mongolia" },
  { code: "+382", iso: "me", country: "Montenegro" },
  { code: "+212", iso: "ma", country: "Morocco" },
  { code: "+258", iso: "mz", country: "Mozambique" },
  { code: "+95", iso: "mm", country: "Myanmar" },
  { code: "+264", iso: "na", country: "Namibia" },
  { code: "+977", iso: "np", country: "Nepal" },
  { code: "+31", iso: "nl", country: "Netherlands" },
  { code: "+64", iso: "nz", country: "New Zealand" },
  { code: "+505", iso: "ni", country: "Nicaragua" },
  { code: "+227", iso: "ne", country: "Niger" },
  { code: "+234", iso: "ng", country: "Nigeria" },
  { code: "+850", iso: "kp", country: "North Korea" },
  { code: "+389", iso: "mk", country: "North Macedonia" },
  { code: "+47", iso: "no", country: "Norway" },
  { code: "+968", iso: "om", country: "Oman" },
  { code: "+92", iso: "pk", country: "Pakistan" },
  { code: "+507", iso: "pa", country: "Panama" },
  { code: "+675", iso: "pg", country: "Papua New Guinea" },
  { code: "+595", iso: "py", country: "Paraguay" },
  { code: "+51", iso: "pe", country: "Peru" },
  { code: "+63", iso: "ph", country: "Philippines" },
  { code: "+48", iso: "pl", country: "Poland" },
  { code: "+351", iso: "pt", country: "Portugal" },
  { code: "+974", iso: "qa", country: "Qatar" },
  { code: "+40", iso: "ro", country: "Romania" },
  { code: "+7", iso: "ru", country: "Russia" },
  { code: "+250", iso: "rw", country: "Rwanda" },
  { code: "+966", iso: "sa", country: "Saudi Arabia" },
  { code: "+221", iso: "sn", country: "Senegal" },
  { code: "+381", iso: "rs", country: "Serbia" },
  { code: "+248", iso: "sc", country: "Seychelles" },
  { code: "+232", iso: "sl", country: "Sierra Leone" },
  { code: "+65", iso: "sg", country: "Singapore" },
  { code: "+421", iso: "sk", country: "Slovakia" },
  { code: "+386", iso: "si", country: "Slovenia" },
  { code: "+252", iso: "so", country: "Somalia" },
  { code: "+27", iso: "za", country: "South Africa" },
  { code: "+82", iso: "kr", country: "South Korea" },
  { code: "+211", iso: "ss", country: "South Sudan" },
  { code: "+34", iso: "es", country: "Spain" },
  { code: "+94", iso: "lk", country: "Sri Lanka" },
  { code: "+249", iso: "sd", country: "Sudan" },
  { code: "+597", iso: "sr", country: "Suriname" },
  { code: "+46", iso: "se", country: "Sweden" },
  { code: "+41", iso: "ch", country: "Switzerland" },
  { code: "+963", iso: "sy", country: "Syria" },
  { code: "+886", iso: "tw", country: "Taiwan" },
  { code: "+992", iso: "tj", country: "Tajikistan" },
  { code: "+255", iso: "tz", country: "Tanzania" },
  { code: "+66", iso: "th", country: "Thailand" },
  { code: "+228", iso: "tg", country: "Togo" },
  { code: "+1868", iso: "tt", country: "Trinidad & Tobago" },
  { code: "+216", iso: "tn", country: "Tunisia" },
  { code: "+90", iso: "tr", country: "Turkey" },
  { code: "+993", iso: "tm", country: "Turkmenistan" },
  { code: "+256", iso: "ug", country: "Uganda" },
  { code: "+380", iso: "ua", country: "Ukraine" },
  { code: "+971", iso: "ae", country: "UAE" },
  { code: "+44", iso: "gb", country: "United Kingdom" },
  { code: "+1", iso: "us", country: "United States" },
  { code: "+598", iso: "uy", country: "Uruguay" },
  { code: "+998", iso: "uz", country: "Uzbekistan" },
  { code: "+58", iso: "ve", country: "Venezuela" },
  { code: "+84", iso: "vn", country: "Vietnam" },
  { code: "+967", iso: "ye", country: "Yemen" },
  { code: "+260", iso: "zm", country: "Zambia" },
  { code: "+263", iso: "zw", country: "Zimbabwe" },
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
                      <FlagIcon code={selectedCountry.iso} size={18} />
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