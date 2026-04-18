

## Goal
Clean up the Spa Package card: remove the leftover single "from" price line that was there before the dropdown, refresh the description to match the new multi-treatment reality, and ensure the price currency follows platform spec (USD primary, GH₵ subtitle — same as every other add-on card).

## What's wrong now
Looking at `src/components/booking/AddOnsStep.tsx`:

1. **Stale "from" price**: Before the dropdown existed, the card showed a single `add_ons.price_ghs` value. That price line still renders even before a treatment is picked, showing "From $ 950 / GH₵ 10,575" (the legacy DB value × FX). It's misleading — the real spa entry point is GH₵ 250 (Sauna) and treatments start at GH₵ 450.
2. **Outdated description**: The DB description reads "One-hour full body massage and spa access" — implies a single fixed package, but the card now offers 17 treatments × 3 durations + Sauna.
3. **Currency confusion**: The card already uses `toUsd` / `toGhs` helpers (platform spec ✓), but `displayPrice` is being read as if it were GHS while `toUsd()` actually expects a USD value (see `currency.ts` — `formatUsd` just formats the number as-is, `formatGhs` multiplies by rate). Result: GH₵ 250 gets displayed as "$ 250 / GH₵ 4,000" which is wrong in both directions.

## Fix

**File:** `src/components/booking/AddOnsStep.tsx`

1. **Hide the price line until a treatment is picked.** When `isSpa && !spaChoice`, render nothing in place of the price (or just the "Pick a treatment to add" hint, which already exists). Once `spaChoice` is set, show the chosen price using the same `toUsd`/`toGhs` pattern as other cards.

2. **Override the description for the spa card** so we don't depend on the stale DB copy. Replace with: *"Choose from 17 treatments — 45, 60, or 90 min sessions. Sauna available."*

3. **Currency correctness.** The spa price list is authored in GH₵, but the rest of the booking flow treats `price_ghs` values as USD when passed to `toUsd`/`toGhs` (that's the platform convention — values stored under `price_ghs` are actually USD-denominated and `formatGhs` converts them to cedis at runtime). To stay consistent:
   - Convert the GH₵ list prices to USD before storing in `spaChoice` and before calling `onToggle`. Use `convertGhsToUsd(ghs) = ghs / rate` from the `useCurrency()` context (need to expose `rate`, which is already on the context).
   - Display the dropdown options with the original GH₵ figure (matches the printed price list the user uploaded — guests recognize it).
   - The card's headline price + summary bar then renders correctly via `toUsd`/`toGhs` like every other add-on.

4. **Remove the redundant "From " prefix** since the price line is now only shown after a choice is made.

## Files touched
- `src/components/booking/AddOnsStep.tsx` only.

## Out of scope
- No change to `add_ons` table row (the DB `price_ghs` becomes irrelevant for Spa but harmless).
- No change to currency utilities or other cards.

