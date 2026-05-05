# Plan: MJ AI — USD-Primary Pricing with GH₵ Equivalent

The MJ AI concierge currently quotes everything in GH₵ only. The website displays USD as the primary currency (with GH₵ as a subtitle) using a live FX rate from `open.er-api.com`. MJ AI must follow the same convention so its quotes match what the guest sees on the site.

All edits are isolated to `supabase/functions/mj-ai/index.ts`.

## 1. Fetch the live USD→GHS rate inside the edge function

Add a small helper at the top of the file:

```ts
let cachedRate: { rate: number; fetchedAt: number } | null = null;
const RATE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getUsdToGhsRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < RATE_TTL_MS) {
    return cachedRate.rate;
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data?.rates?.GHS) {
      cachedRate = { rate: data.rates.GHS, fetchedAt: Date.now() };
      return cachedRate.rate;
    }
  } catch (e) {
    console.error("FX fetch failed:", e);
  }
  return cachedRate?.rate ?? 16; // same fallback as frontend
}

function ghsToUsd(ghs: number, rate: number) {
  return Math.round(ghs / rate);
}
function fmtPrice(ghs: number, rate: number) {
  return `$${ghsToUsd(ghs, rate).toLocaleString()} (≈ GH₵ ${Math.round(ghs).toLocaleString()})`;
}
```

`buildDynamicContext` becomes `buildDynamicContext(supabase, rate)` and is called as `await buildDynamicContext(supabase, await getUsdToGhsRate())`.

## 2. Update the SYSTEM_PROMPT currency rules

Replace the line:
> All prices are in Ghana Cedis — display as "GH₵ X"

With:
> Prices are stored in Ghana Cedis but the website displays USD as the primary currency with GH₵ as the equivalent. ALWAYS quote prices the same way: `$X (≈ GH₵ Y)`. Never quote GH₵ alone unless the guest explicitly asks for cedis only. Use the live rate provided in the knowledge base below for any conversion you must do yourself.

Inject the current rate near the top of the dynamic knowledge base:
```
=== CURRENCY ===
Base display: USD ($). Equivalent: GH₵.
Live rate: 1 USD = {RATE} GHS (refreshed hourly).
Format every price as "$X (≈ GH₵ Y)".
```

Update the booking confirmation example on line 67 to:
> "Your booking is confirmed! Reference code: **MJ-A1B2C3D4**. Total: **$80 (≈ GH₵ 1,200)**."

## 3. Convert dynamic content (rooms, promos, menu, Sunday buffet)

- **Rooms** (line ~1239): replace `GH₵ ${r.base_price_ghs}` with `fmtPrice(r.base_price_ghs, rate)/night`.
- **Promotions** (line ~1267): `discount_type === "fixed"` → `fmtPrice(p.discount_value, rate) off`. Percentage discounts stay as-is.
- **Menu items** (line ~1325): prices are stored as free-text strings (e.g. `"GH₵ 90"`, `"M: GH₵ 150 / L: GH₵ 200"`). Add a regex pass that finds each `GH₵ <number>` token and rewrites it to `$X (≈ GH₵ N)` using the rate. Tokens that don't match are left intact.
- **Sunday Buffet** static text (line 264): change `Price: GHS 250 per person` → `Price: $19 (≈ GH₵ 300) per person` and rely on the rule above so the AI re-states it correctly. (Current static value is stale — update to the GH₵ 300 figure already used elsewhere.)
- **Static menu fallback section** (lines 272–444): add a one-line note at the top — *"Prices listed in GH₵; quote to guests as USD primary using the live rate above."* No need to rewrite all 170 lines; the AI will convert on the fly using the documented rate.
- **Dining page reference** in WEBSITE NAVIGATION (line 540): update `(GHS 250/person)` → `($19 ≈ GH₵ 300/person)`.

## 4. Booking tool responses (`search_available_rooms`)

Augment the returned room object so the model gets both numbers without recomputing:

```ts
return {
  ...,
  nightly_rate_ghs: avgNightlyRate,
  nightly_rate_usd: ghsToUsd(avgNightlyRate, rate),
  total_price_ghs: Math.round(totalPrice),
  total_price_usd: ghsToUsd(totalPrice, rate),
  fx_rate: rate,
};
```

Same treatment for `getAddOns` (add `price_usd`) and the `create_booking` success payload (return both `final_total_ghs` and `final_total_usd`). Pass the rate into these helpers (or have them call `getUsdToGhsRate()` once).

The tool description text in `TOOLS` for `create_booking.nightly_rate` stays in GH₵ (DB-native); we just instruct the model in SYSTEM_PROMPT to quote both currencies to the guest.

## 5. No DB or schema changes

This is purely a prompt/edge-function change. No migration, no new secrets (open.er-api.com is public, no key needed — same source the frontend already uses).

## Out of scope

- Rewriting the static menu fallback line by line (the dynamic DB menu is the source of truth and will be auto-converted).
- Changing how prices are stored in the database — they remain in GH₵.

Once approved, I'll implement these edits in `supabase/functions/mj-ai/index.ts` in a single pass; the function auto-deploys.
