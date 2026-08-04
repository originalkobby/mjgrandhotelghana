export const RATE_CACHE_TTL = 60_000; // 60 seconds
export const FIXED_USD_TO_GHS_RATE = 12.5;

export interface RateResult {
  rate: number;
}

/** Fixed USD → GHS rate (1 USD = 12.5 GHS). */
export async function fetchUsdToGhsRate(): Promise<RateResult> {
  return { rate: FIXED_USD_TO_GHS_RATE };
}

/** Convert USD to GHS */
export function usdToGhs(usdAmount: number, rate: number = FIXED_USD_TO_GHS_RATE): number {
  return usdAmount * rate;
}

/** Format a USD amount as USD string (displayed as-is) */
export function formatUsd(usdAmount: number, _rate?: number): string {
  return `$ ${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format a USD amount as GH₵ string (converted via rate) */
export function formatGhs(usdAmount: number, rate: number = FIXED_USD_TO_GHS_RATE): string {
  const ghs = usdToGhs(usdAmount, rate);
  return `GH₵ ${ghs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format amount in the given currency mode */
export function formatCurrency(
  usdAmount: number,
  rate: number = FIXED_USD_TO_GHS_RATE,
  mode: "usd" | "ghs" = "usd"
): string {
  return mode === "usd" ? formatUsd(usdAmount) : formatGhs(usdAmount, rate);
}
