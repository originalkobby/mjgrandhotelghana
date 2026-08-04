import { useCurrency } from "@/contexts/CurrencyContext";

interface PriceDisplayProps {
  /** Amount in GHS (as stored in DB) */
  amount: number;
  /** Show both currencies (USD primary + GH₵ subtitle). Default for public pages. */
  showBoth?: boolean;
  /** Use admin mode toggle instead. For admin pages. */
  adminMode?: boolean;
  /** Additional class for the primary price */
  className?: string;
  /** Additional class for the subtitle */
  subtitleClassName?: string;
  /** Prefix text (e.g. "From") */
  prefix?: string;
  /** Suffix text (e.g. "per night", "total") */
  suffix?: string;
}

/**
 * Unified price display component.
 * - Public pages: shows USD primary with GH₵ subtitle
 * - Admin pages: shows based on admin toggle (USD or GHS)
 */
export default function PriceDisplay({
  amount,
  showBoth = false,
  adminMode = false,
  className = "",
  subtitleClassName = "",
  prefix,
  suffix,
}: PriceDisplayProps) {
  const { toUsd, toGhs, format } = useCurrency();

  if (adminMode) {
    return (
      <span className={className}>
        {prefix && <>{prefix} </>}
        {format(amount)}
        {suffix && <> {suffix}</>}
      </span>
    );
  }

  if (showBoth) {
    return (
      <span className={className}>
        {prefix && <>{prefix} </>}
        {toUsd(amount)}
        {suffix && <> {suffix}</>}
        <span className={`block text-xs text-muted-foreground ${subtitleClassName}`}>
          {toGhs(amount)}
        </span>
      </span>
    );
  }

  // Default: USD with GH₵ subtitle
  return (
    <span className={className}>
      {prefix && <>{prefix} </>}
      {toUsd(amount)}
      {suffix && <> {suffix}</>}
      <span className={`block text-xs text-muted-foreground ${subtitleClassName}`}>
        {toGhs(amount)}
      </span>
    </span>
  );
}
