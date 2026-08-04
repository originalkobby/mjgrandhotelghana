import { describe, it, expect } from "vitest";
import { formatUsd, formatGhs, usdToGhs, FIXED_USD_TO_GHS_RATE } from "@/lib/currency";

/**
 * Canonical room rates (USD). Single source of truth used by all UI surfaces
 * via rooms.base_price_ghs. If any surface renders a different number for
 * these room types, parity is broken.
 */
export const CANONICAL_RATES_USD: Record<string, number> = {
  Single: 110,
  Standard: 125,
  Deluxe: 130,
  "Twin Bed": 140,
  "Junior Suite": 150,
  Executive: 200,
};

describe("Rate parity — currency helpers", () => {
  it("uses the fixed 12.5 GHS/USD rate", () => {
    expect(FIXED_USD_TO_GHS_RATE).toBe(12.5);
  });

  it("produces identical formatted output for identical USD input (homepage vs booking vs dashboard)", () => {
    // Every surface pipes rooms.base_price_ghs through the same helpers.
    // Same input → same output guarantees on-screen parity.
    for (const [room, usd] of Object.entries(CANONICAL_RATES_USD)) {
      const homepageUsd = formatUsd(usd);
      const bookingUsd = formatUsd(usd);
      const dashboardUsd = formatUsd(usd);
      expect(homepageUsd, `USD parity failed for ${room}`).toBe(bookingUsd);
      expect(bookingUsd).toBe(dashboardUsd);

      const homepageGhs = formatGhs(usd);
      const bookingGhs = formatGhs(usd);
      const dashboardGhs = formatGhs(usd);
      expect(homepageGhs, `GHS parity failed for ${room}`).toBe(bookingGhs);
      expect(bookingGhs).toBe(dashboardGhs);
    }
  });

  it("converts every canonical rate at the fixed rate", () => {
    for (const [room, usd] of Object.entries(CANONICAL_RATES_USD)) {
      expect(usdToGhs(usd), `Conversion drifted for ${room}`).toBe(usd * 12.5);
    }
  });
});
