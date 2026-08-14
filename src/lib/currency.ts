import { supabase } from "@/integrations/supabase/client";

export const RATE_CACHE_TTL = 60_000; // 60 seconds
/** Fallback rate used only when the stored setting can't be read. */
export const FIXED_USD_TO_GHS_RATE = 12.5;

export interface RateResult {
  rate: number;
}

/** Read the admin-managed USD → GHS rate from app_settings. */
export async function fetchUsdToGhsRate(): Promise<RateResult> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("usd_to_ghs")
      .eq("key", "currency")
      .maybeSingle();
    const rate = Number(data?.usd_to_ghs);
    if (Number.isFinite(rate) && rate > 0) return { rate };
  } catch {
    // fall through to the default
  }
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
