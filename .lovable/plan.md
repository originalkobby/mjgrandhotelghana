

## Plan: Dynamic Pricing for Early Check-In & Late Checkout

**Goal**: Make "Early Check-In" and "Late Checkout" add-ons automatically priced at **50% of the selected room's nightly rate**, instead of using fixed database values.

### How It Works

The database will still store a placeholder price for these two add-ons, but the UI will override it at runtime based on the selected room's `nightlyRate`. This keeps the logic simple and ensures the price always matches the room.

### Changes

**1. `src/components/booking/AddOnsStep.tsx`**
- After fetching add-ons from the database, override `price_ghs` for items named "Early Check-in" and "Late Checkout" with `selectedRoom.nightlyRate / 2`.
- This affects display and the price passed to `onToggle`, so downstream steps (guest details, payment, create-booking) automatically use the correct amount.

**2. `supabase/functions/create-booking/index.ts`**
- In the server-side pricing validation, apply the same rule: when computing add-on totals, if an add-on is "Early Check-in" or "Late Checkout", use `room.base_price_ghs / 2` (or the inventory-derived nightly rate) instead of the stored `price_ghs`. This prevents price manipulation from the client side.

### Technical Detail

- **Matching logic**: Add-ons identified by name (`Early Check-in`, `Late Checkout`). This is safe since add-on names are admin-controlled.
- **Price flow**: The overridden price propagates through `onToggle` → `selectedAddOns` → `handleSubmitBooking` → edge function, where it's re-validated server-side.
- **No database schema changes** required.

