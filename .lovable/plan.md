# Editable Exchange Rate

Let admins and operations managers set the USD → GH₵ rate from the dashboard, replacing the hardcoded 12.5 everywhere (public site, dashboard, and MJ AI / booking edge functions).

## What changes

### 1. Rate stored in the database
- New `app_settings` table holding a single row for the exchange rate (`usd_to_ghs`), plus who last updated it and when.
- Seeded with the current 12.5 so nothing shifts on release.
- Anyone (including guests on the public site) can read the rate; only `admin` and `operations_manager` can change it.

### 2. Settings page — new "Exchange Rate" tab
- Shows the current rate, who last changed it, and when (DD/MM/YYYY).
- Numeric input with a Save button, styled to match the warm dashboard theme.
- Validation: must be a positive number within a sane band (e.g. 1–100); confirm dialog before saving since it repricing everything.
- Read-only for `front_desk`, `finance`, `revenue_manager` — they see the value but no input.

### 3. Live propagation
- `CurrencyContext` loads the rate from the database on start instead of the fixed constant, and subscribes to changes so open dashboards and guest sessions pick up a new rate without a reload.
- The header's "1 USD = X GHS" readout and every price surface follow automatically (they already read from the context).

### 4. Server-side pricing
- MJ AI, booking creation, extend-checkout, dynamic pricing, and promo validation currently use their own hardcoded 12.5; each reads the rate from `app_settings` instead, so AI quotes and stored totals match the site.

## Technical notes
- Migration: create `public.app_settings` with GRANTs (`select` to anon + authenticated, write to admin/operations_manager via RLS using `has_role`), RLS enabled, `updated_at` trigger, seed row at 12.5, and add the table to the realtime publication.
- `src/lib/currency.ts`: `FIXED_USD_TO_GHS_RATE` becomes a fallback default only; `fetchUsdToGhsRate()` queries the table.
- Edge functions get a small shared `getFxRate()` helper that reads the row (cached in-memory per instance for ~60s).
- Touch points: `src/lib/currency.ts`, `src/contexts/CurrencyContext.tsx`, `src/pages/admin/Settings.tsx`, `supabase/functions/{mj-ai,create-booking,extend-checkout,dynamic-pricing,validate-promo}`.
- Existing bookings keep their stored totals; the rate only affects new quotes and display conversions.

## Out of scope
- Automatic rate feeds from an FX API.
- Historical rate log beyond "last updated by/at".
