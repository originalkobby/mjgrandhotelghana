import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { CANONICAL_RATES_USD } from "./rate-parity.test";

/**
 * Guard: price-rendering surfaces must never hardcode a canonical room rate.
 * All prices must originate from rooms.base_price_ghs (fetched from Supabase).
 */
const PRICE_SURFACES = [
  "src/components/RoomsPreview.tsx",
  "src/components/booking/RoomSelectionStep.tsx",
  "src/pages/Booking.tsx",
  "src/pages/admin/Bookings.tsx",
];

const CANONICAL_NUMBERS = Array.from(new Set(Object.values(CANONICAL_RATES_USD)));

function stripCommentsAndStrings(src: string): string {
  // Remove line comments, block comments, and string literals so we only
  // scan executable code for suspicious rate literals.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

describe("Rate parity — no hardcoded rates in UI", () => {
  for (const file of PRICE_SURFACES) {
    it(`${file} contains no hardcoded canonical rate literal`, () => {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      const cleaned = stripCommentsAndStrings(src);

      for (const rate of CANONICAL_NUMBERS) {
        // \b boundary catches 110 but not 1100, 21100, etc.
        const re = new RegExp(`\\b${rate}\\b`);
        expect(
          re.test(cleaned),
          `Hardcoded rate ${rate} found in ${file}. All prices must come from rooms.base_price_ghs.`
        ).toBe(false);
      }
    });
  }

  it("each price surface reads from base_price_ghs or final_total_ghs", () => {
    for (const file of PRICE_SURFACES) {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      const readsFromDb = /base_price_ghs|final_total_ghs/.test(src);
      expect(readsFromDb, `${file} must render prices from base_price_ghs or final_total_ghs`).toBe(true);
    }
  });
});
