const RATE_CACHE_KEY = "mj_usd_ghs_rate";
const RATE_CACHE_TTL = 3600_000; // 1 hour

interface CachedRate {
  rate: number;
  fetchedAt: number;
}

/** Fetch live USD → GHS rate with localStorage caching */
export async function fetchUsdToGhsRate(): Promise<number> {
  // Check cache first
  try {
    const cached = localStorage.getItem(RATE_CACHE_KEY);
    if (cached) {
      const parsed: CachedRate = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < RATE_CACHE_TTL) {
        return parsed.rate;
      }
    }
  } catch {}

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data?.rates?.GHS) {
      const rate = data.rates.GHS;
      localStorage.setItem(
        RATE_CACHE_KEY,
        JSON.stringify({ rate, fetchedAt: Date.now() })
      );
      return rate;
    }
  } catch (err) {
    console.error("Failed to fetch exchange rate:", err);
  }

  // Fallback rate
  return 16;
}

/** Convert GHS to USD */
export function ghsToUsd(ghsAmount: number, rate: number): number {
  return rate > 0 ? ghsAmount / rate : ghsAmount;
}

/** Format a GHS amount as USD string */
export function formatUsd(ghsAmount: number, rate: number): string {
  const usd = ghsToUsd(ghsAmount, rate);
  return `$ ${usd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format a GHS amount as GH₵ string */
export function formatGhs(ghsAmount: number): string {
  return `GH₵ ${ghsAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format amount in the given currency mode */
export function formatCurrency(
  ghsAmount: number,
  rate: number,
  mode: "usd" | "ghs" = "usd"
): string {
  return mode === "usd" ? formatUsd(ghsAmount, rate) : formatGhs(ghsAmount);
}
