import { describe, expect, it } from "vitest";
import {
  computeRiderEarning,
  FALLBACK_RULE,
  type CompRule,
} from "../../supabase/functions/_shared/riderPay";

const rule = (over: Partial<CompRule>): CompRule => ({ ...FALLBACK_RULE, ...over });
const noon = new Date("2026-01-01T12:00:00Z");
const evening = new Date("2026-01-01T19:00:00Z");

describe("rider compensation models", () => {
  it("fixed pays the base regardless of distance or fee", () => {
    const r = rule({ model: "fixed", base_ghs: 20, min_earning_ghs: 0 });
    expect(computeRiderEarning(r, 2, 15, noon).earning_ghs).toBe(20);
    expect(computeRiderEarning(r, 40, 90, noon).earning_ghs).toBe(20);
  });

  it("per_km multiplies distance by the per-km rate", () => {
    const r = rule({ model: "per_km", per_km_ghs: 2.5, min_earning_ghs: 0 });
    expect(computeRiderEarning(r, 8, 30, noon).earning_ghs).toBe(20);
  });

  it("percentage takes a share of the customer delivery fee only", () => {
    const r = rule({ model: "percentage", percent_of_fee: 60, min_earning_ghs: 0 });
    expect(computeRiderEarning(r, 12, 27, noon).earning_ghs).toBe(16.2);
  });

  it("hybrid combines base, distance and percentage", () => {
    const r = rule({
      model: "hybrid",
      base_ghs: 10,
      per_km_ghs: 2,
      percent_of_fee: 10,
      min_earning_ghs: 0,
    });
    // 10 + (5 * 2) + (27 * 0.1) = 22.70
    expect(computeRiderEarning(r, 5, 27, noon).earning_ghs).toBe(22.7);
  });

  it("clamps to the minimum and maximum earning", () => {
    const low = rule({ model: "per_km", per_km_ghs: 1, min_earning_ghs: 12 });
    expect(computeRiderEarning(low, 2, 30, noon).earning_ghs).toBe(12);

    const high = rule({ model: "per_km", per_km_ghs: 10, max_earning_ghs: 50 });
    expect(computeRiderEarning(high, 40, 30, noon).earning_ghs).toBe(50);
  });

  it("applies the peak bonus only inside peak hours", () => {
    const r = rule({
      model: "fixed",
      base_ghs: 20,
      peak_bonus_ghs: 5,
      min_earning_ghs: 0,
    });
    expect(computeRiderEarning(r, 4, 30, noon).earning_ghs).toBe(20);
    expect(computeRiderEarning(r, 4, 30, evening).earning_ghs).toBe(25);
  });

  it("uses the delivery-settings peak window, not a rider-specific one", () => {
    const r = rule({ model: "fixed", base_ghs: 20, peak_bonus_ghs: 5, min_earning_ghs: 0 });
    const lunchWindow = { peak_start_hour: 11, peak_end_hour: 13 };
    expect(computeRiderEarning(r, 4, 30, noon, lunchWindow).earning_ghs).toBe(25);
    expect(computeRiderEarning(r, 4, 30, evening, lunchWindow).earning_ghs).toBe(20);
  });

  it("never returns a negative earning and is deterministic", () => {
    const r = rule({ model: "per_km", per_km_ghs: 3, min_earning_ghs: 0 });
    expect(computeRiderEarning(r, -10, -5, noon).earning_ghs).toBe(0);
    expect(computeRiderEarning(r, 6, 20, noon)).toEqual(computeRiderEarning(r, 6, 20, noon));
  });

  it("records a traceable snapshot of the rule that produced the figure", () => {
    const r = rule({ model: "hybrid", base_ghs: 10, per_km_ghs: 2, min_earning_ghs: 0 });
    const { snapshot } = computeRiderEarning(r, 5, 27, noon);
    expect(snapshot).toMatchObject({
      model: "hybrid",
      base_ghs: 10,
      per_km_ghs: 2,
      distance_km: 5,
      customer_fee_ghs: 27,
    });
  });

  it("keeps rider pay independent of the customer fee for non-percentage models", () => {
    const r = rule({ model: "fixed", base_ghs: 20, min_earning_ghs: 0 });
    const cheap = computeRiderEarning(r, 6, 12, noon).earning_ghs;
    const pricey = computeRiderEarning(r, 6, 120, noon).earning_ghs;
    expect(cheap).toBe(pricey);
  });
});
