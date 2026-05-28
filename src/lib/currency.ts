const RATE_CACHE_KEY = "mj_usd_ghs_rate";
export const RATE_CACHE_TTL = 3600_000; // 1 hour

interface CachedRate {
  rate: number;
  fetchedAt: number;
}

export interface RateResult {
  rate: number;
  fetchedAt: number;
}

/** Fetch live USD → GHS rate with localStorage caching */
export async function fetchUsdToGhsRate(): Promise<RateResult> {
  // Check cache first
  try {
    const cached = localStorage.getItem(RATE_CACHE_KEY);
    if (cached) {
      const parsed: CachedRate = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < RATE_CACHE_TTL) {
        return { rate: parsed.rate, fetchedAt: parsed.fetchedAt };
      }
    }
  } catch {}

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data?.rates?.GHS) {
      const rate = data.rates.GHS;
      const fetchedAt = Date.now();
      localStorage.setItem(
        RATE_CACHE_KEY,
        JSON.stringify({ rate, fetchedAt })
      );
      return { rate, fetchedAt };
    }
  } catch (err) {
    console.error("Failed to fetch exchange rate:", err);
  }

  // Fallback rate
  return { rate: 16, fetchedAt: Date.now() };
}

/** Convert USD to GHS */
export function usdToGhs(usdAmount: number, rate: number): number {
  return usdAmount * rate;
}

/** Format a USD amount as USD string (displayed as-is) */
export function formatUsd(usdAmount: number, _rate?: number): string {
  return `$ ${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format a USD amount as GH₵ string (converted via rate) */
export function formatGhs(usdAmount: number, rate: number): string {
  const ghs = usdToGhs(usdAmount, rate);
  return `GH₵ ${ghs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format amount in the given currency mode */
export function formatCurrency(
  usdAmount: number,
  rate: number,
  mode: "usd" | "ghs" = "usd"
): string {
  return mode === "usd" ? formatUsd(usdAmount) : formatGhs(usdAmount, rate);
}
