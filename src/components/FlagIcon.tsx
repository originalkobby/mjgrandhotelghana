/**
 * SVG flag icon using flagcdn.com
 * Pass a 2-letter ISO country code (lowercase).
 */
interface FlagIconProps {
  code: string; // ISO 3166-1 alpha-2, e.g. "gh"
  size?: number;
  className?: string;
}

export default function FlagIcon({ code, size = 20, className = "" }: FlagIconProps) {
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w${size > 20 ? 40 : 20}/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w${size > 20 ? 80 : 40}/${code.toLowerCase()}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={code.toUpperCase()}
      className={`inline-block rounded-sm object-cover ${className}`}
      loading="lazy"
    />
  );
}

/** Map phone prefix to ISO country code */
const PHONE_TO_ISO: [string, string][] = [
  ["+233", "gh"], ["+234", "ng"], ["+1", "us"], ["+44", "gb"],
  ["+27", "za"], ["+49", "de"], ["+33", "fr"], ["+91", "in"],
  ["+86", "cn"], ["+81", "jp"], ["+61", "au"], ["+971", "ae"],
  ["+254", "ke"], ["+225", "ci"], ["+228", "tg"], ["+229", "bj"],
  ["+82", "kr"], ["+7", "ru"], ["+39", "it"], ["+34", "es"],
  ["+55", "br"], ["+52", "mx"], ["+62", "id"], ["+63", "ph"],
  ["+66", "th"], ["+84", "vn"], ["+90", "tr"], ["+20", "eg"],
  ["+212", "ma"], ["+255", "tz"], ["+256", "ug"], ["+250", "rw"],
  ["+237", "cm"], ["+221", "sn"], ["+92", "pk"], ["+880", "bd"],
  ["+94", "lk"], ["+60", "my"], ["+65", "sg"], ["+353", "ie"],
  ["+31", "nl"], ["+46", "se"], ["+47", "no"], ["+45", "dk"],
  ["+41", "ch"], ["+43", "at"], ["+48", "pl"], ["+380", "ua"],
  ["+966", "sa"], ["+974", "qa"], ["+965", "kw"], ["+968", "om"],
  ["+973", "bh"], ["+964", "iq"], ["+962", "jo"], ["+961", "lb"],
  ["+263", "zw"], ["+260", "zm"], ["+267", "bw"], ["+264", "na"],
];

export function getIsoFromPhone(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\s+/g, "");
  // Sort by prefix length descending to match longest first
  for (const [prefix, iso] of PHONE_TO_ISO.sort((a, b) => b[0].length - a[0].length)) {
    if (cleaned.startsWith(prefix)) return iso;
  }
  return null;
}
