// Rider compensation: the single source of truth for what a rider earns.
// Customer money (delivery fee) and rider money (compensation) are separate
// concepts — nothing here ever mutates a customer amount.

export type CompModel = "fixed" | "per_km" | "percentage" | "hybrid";

export type CompRule = {
  id: string | null;
  model: CompModel;
  base_ghs: number;
  per_km_ghs: number;
  percent_of_fee: number;
  min_earning_ghs: number;
  max_earning_ghs: number;
  peak_bonus_ghs: number;
};

/**
 * The peak window is a single, system-wide setting stored on
 * `delivery_settings` — the same window that drives the guest peak uplift.
 * Rider pay reads it from there so the two can never drift apart.
 */
export type PeakWindow = { peak_start_hour: number; peak_end_hour: number };

export const DEFAULT_PEAK_WINDOW: PeakWindow = { peak_start_hour: 18, peak_end_hour: 21 };

export const FALLBACK_RULE: CompRule = {
  id: null,
  model: "fixed",
  base_ghs: 15,
  per_km_ghs: 0,
  percent_of_fee: 0,
  min_earning_ghs: 0,
  max_earning_ghs: 200,
  peak_bonus_ghs: 0,
};

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/** Loads the active rule; never throws — falls back to a safe fixed rule. */
export async function loadCompRule(supabase: any): Promise<CompRule> {
  try {
    const { data } = await supabase
      .from("rider_compensation_rules")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return FALLBACK_RULE;
    const out: any = { ...FALLBACK_RULE, id: data.id, model: data.model };
    for (const k of Object.keys(FALLBACK_RULE)) {
      if (k === "id" || k === "model") continue;
      const v = (data as any)[k];
      if (v !== null && v !== undefined) out[k] = Number(v);
    }
    return out as CompRule;
  } catch {
    return FALLBACK_RULE;
  }
}

/** Loads the system-wide peak window; never throws. */
export async function loadPeakWindow(supabase: any): Promise<PeakWindow> {
  try {
    const { data } = await supabase
      .from("delivery_settings")
      .select("peak_start_hour, peak_end_hour")
      .limit(1)
      .maybeSingle();
    if (!data) return DEFAULT_PEAK_WINDOW;
    return {
      peak_start_hour: Number(data.peak_start_hour ?? DEFAULT_PEAK_WINDOW.peak_start_hour),
      peak_end_hour: Number(data.peak_end_hour ?? DEFAULT_PEAK_WINDOW.peak_end_hour),
    };
  } catch {
    return DEFAULT_PEAK_WINDOW;
  }
}

export function isPeak(window: PeakWindow, at: Date): boolean {
  const h = at.getUTCHours(); // Accra is UTC+0 year round
  return window.peak_start_hour <= window.peak_end_hour
    ? h >= window.peak_start_hour && h <= window.peak_end_hour
    : h >= window.peak_start_hour || h <= window.peak_end_hour;
}

export type EarningResult = {
  earning_ghs: number;
  snapshot: Record<string, unknown>;
};

/** Pure, deterministic earning calculation — unit tested. */
export function computeRiderEarning(
  rule: CompRule,
  distanceKm: number,
  customerFeeGhs: number,
  at: Date = new Date(),
  peakWindow: PeakWindow = DEFAULT_PEAK_WINDOW,
): EarningResult {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const fee = Math.max(0, Number(customerFeeGhs) || 0);

  let raw = 0;
  switch (rule.model) {
    case "fixed":
      raw = rule.base_ghs;
      break;
    case "per_km":
      raw = distance * rule.per_km_ghs;
      break;
    case "percentage":
      raw = fee * (rule.percent_of_fee / 100);
      break;
    case "hybrid":
      raw =
        rule.base_ghs +
        distance * rule.per_km_ghs +
        fee * (rule.percent_of_fee / 100);
      break;
  }

  const peak = rule.peak_bonus_ghs > 0 && isPeak(peakWindow, at);
  const withBonus = raw + (peak ? rule.peak_bonus_ghs : 0);
  const clamped = Math.min(
    rule.max_earning_ghs,
    Math.max(rule.min_earning_ghs, withBonus),
  );

  return {
    earning_ghs: round2(clamped),
    snapshot: {
      rule_id: rule.id,
      model: rule.model,
      base_ghs: rule.base_ghs,
      per_km_ghs: rule.per_km_ghs,
      percent_of_fee: rule.percent_of_fee,
      distance_km: distance,
      customer_fee_ghs: fee,
      raw_ghs: round2(raw),
      peak_applied: peak,
      peak_window: peakWindow,
      peak_bonus_ghs: peak ? rule.peak_bonus_ghs : 0,
      min_earning_ghs: rule.min_earning_ghs,
      max_earning_ghs: rule.max_earning_ghs,
      computed_at: at.toISOString(),
    },
  };
}

/**
 * Accrues the earning for a delivered job. Idempotent: `rider_earnings.delivery_id`
 * is unique, so a retried or duplicated delivered event can never pay twice.
 */
export async function accrueEarning(
  supabase: any,
  delivery: {
    id: string;
    rider_id: string | null;
    food_order_id: string;
    distance_km: number | string;
    fee_ghs: number | string;
  },
): Promise<{ created: boolean; earning_ghs?: number; reason?: string }> {
  if (!delivery.rider_id) return { created: false, reason: "no_rider" };

  const { data: existing } = await supabase
    .from("rider_earnings")
    .select("id")
    .eq("delivery_id", delivery.id)
    .maybeSingle();
  if (existing) return { created: false, reason: "already_accrued" };

  const rule = await loadCompRule(supabase);
  const { earning_ghs, snapshot } = computeRiderEarning(
    rule,
    Number(delivery.distance_km),
    Number(delivery.fee_ghs),
  );

  const { error } = await supabase.from("rider_earnings").insert({
    delivery_id: delivery.id,
    food_order_id: delivery.food_order_id,
    rider_id: delivery.rider_id,
    distance_km: Number(delivery.distance_km) || 0,
    customer_fee_ghs: Number(delivery.fee_ghs) || 0,
    base_earning_ghs: earning_ghs,
    earning_ghs,
    status: "pending",
    rule_id: rule.id,
    rule_snapshot: snapshot,
    delivered_at: new Date().toISOString(),
  });

  // A unique-violation means another concurrent call won the race: not an error.
  if (error && !String(error.code).includes("23505")) {
    console.error("accrueEarning failed", error);
    return { created: false, reason: "insert_failed" };
  }
  return { created: !error, earning_ghs };
}
