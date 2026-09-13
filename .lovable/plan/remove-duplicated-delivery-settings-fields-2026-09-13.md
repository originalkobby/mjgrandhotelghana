# Remove duplicated delivery settings fields

The Deliveries → Settings screen currently asks for the same information twice, and one field does not do what its label says.

## What's duplicated

1. **Peak starts / Peak ends (hour, 0-23)** appears twice — once under "Pricing and timing" (guest-facing peak uplift) and again under "Rider compensation" (rider peak bonus). Both are stored separately and both currently read 18 / 21. Staff can set them to different values by mistake, so the same evening rush can count as "peak" for the guest charge but not for rider pay.

2. **"Rider location update (seconds)"** is labelled as a rider setting but is actually only used to decide how often the guest's tracking page refreshes. The rider app ignores it and pings on its own fixed 30-second timer.

## The fix

**One peak window for the whole delivery system.** Keep the peak hours in "Pricing and timing" only, where they sit next to the peak uplift. Under Rider compensation, remove the two hour inputs and show a short read-only line instead: "Peak window: 18:00-21:00, set under Pricing and timing." The peak-time bonus amount stays on the rider card, because that amount is genuinely rider-specific.

**Honest labels and real behaviour for the refresh setting.** Rename the field to "Tracking page refresh (seconds)" and keep it powering the guest tracking page. Add the rider app to it too, so the rider's location pings use the same configured interval instead of a hard-coded 30 seconds.

Existing rider pay records are untouched — each earning keeps the rule snapshot that produced it.

## Technical notes

- Rider pay peak detection moves from `rider_compensation_rules.peak_start_hour/peak_end_hour` to `delivery_settings.peak_start_hour/peak_end_hour`:
  - `supabase/functions/_shared/riderPay.ts`: `isPeak` takes the peak window as an argument; `loadCompRule` continues to load the rule, and `accrueEarning` reads the window from `delivery_settings` (falling back to 18/21). `rule_snapshot` records the window used.
  - `src/test/rider-pay.test.ts`: update calls to the new `isPeak`/`computeRiderEarning` signature; add a case proving the delivery-settings window drives the bonus.
  - The two columns on `rider_compensation_rules` are left in place (harmless, no longer read) so no data is destroyed.
- `src/components/admin/RiderCompensationCard.tsx`: drop `peak_start_hour`/`peak_end_hour` from `FIELDS`; fetch `delivery_settings.peak_start_hour/peak_end_hour` and render the read-only helper line.
- `src/components/admin/DeliverySettingsPanel.tsx`: relabel `rider_ping_seconds` to "Tracking page refresh (seconds)".
- `src/pages/RiderPortal.tsx`: read `delivery_settings.rider_ping_seconds` and use `max(10s, value)` as the idle-ping throttle instead of the hard-coded 30s.
- Verify with `npx tsgo --noEmit -p tsconfig.app.json` and `bunx vitest run src/test/rider-pay.test.ts`.
