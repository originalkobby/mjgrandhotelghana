import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { CANONICAL_RATES_USD } from "./rate-parity.test";

/**
 * Live DB parity check. Opt-in: set RUN_DB_PARITY=1 to run.
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in env.
 */
const shouldRun = process.env.RUN_DB_PARITY === "1";
const d = shouldRun ? describe : describe.skip;

d("Rate parity — live database", () => {
  const url = process.env.VITE_SUPABASE_URL!;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, key);

  it("rooms.base_price_ghs matches the canonical map", async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("name, base_price_ghs")
      .eq("is_active", true);

    expect(error).toBeNull();
    expect(data).toBeTruthy();

    for (const room of data!) {
      const expected = CANONICAL_RATES_USD[room.name];
      if (expected === undefined) continue; // ignore rooms not in canonical set
      expect(
        room.base_price_ghs,
        `${room.name} price drift: expected ${expected}, got ${room.base_price_ghs}`
      ).toBe(expected);
    }
  });
});
