# Rider Earnings, Payouts & Cash Reconciliation

Money the customer pays and money the rider earns become two completely separate books. Riders never see hotel margin; riders never keep cash without it being recorded.

## What gets built

### 1. Rider compensation rules (admin)
A new "Compensation" section in Deliveries → Settings where an admin picks the active model:
- Fixed amount per delivery
- Per-kilometre
- Percentage of the customer delivery fee
- Hybrid (base + per-km, optionally plus percentage)

Plus base rider fee, per-km rate, percentage, minimum earning, maximum earning, and a peak-time bonus. Changes are versioned — earnings already calculated keep the rule that produced them.

### 2. Earnings ledger
When a delivery is marked **Delivered**, the system creates one earning row automatically: order, delivery, rider, distance, customer delivery fee, rider earning, plus a snapshot of the rule used so every figure is traceable.

Statuses: Pending → Approved → Payable → Paid, with Disputed and Adjusted. Nothing is ever auto-marked Paid.

### 3. Rider portal earnings tab
Riders see: Today, This week, This month, Pending payout, Total paid; completed deliveries, average earning per delivery, and a delivery-by-delivery history. No hotel revenue or margin figures.

### 4. Delivery Payouts (admin / operations manager)
A new tab beside Board/Riders/Settings/Reports:
- Unpaid earnings grouped by rider
- Approve earnings, mark payable
- Record a payout: amount, deliveries covered, date range, method (Cash / Mobile Money / Bank Transfer), reference, notes — recorded by whom and when
- Payout history
- Adjust an earning — reason is mandatory, logged with the admin and timestamp
- Rider statement: opening balance, completed deliveries, gross earnings, adjustments, previous payouts, current payable

No money moves automatically. This is a payout ledger; staff record the payment they actually made.

### 5. Cash on delivery reconciliation
On delivery, a COD rider records cash collected. A new reconciliation screen shows, per day: customer amount due vs cash collected vs remitted to the hotel, outstanding cash per rider, and a "Record remittance" action for staff. COD orders are only settled once staff confirm the remittance.

### 6. Daily reconciliation view
COD collected, Paystack collected, total customer sales, rider earnings accrued, rider payouts, outstanding rider balance, and hotel delivery revenue (customer fees minus rider compensation). Every total drills down to its source rows.

## Technical notes

**Database (one migration, with GRANTs + RLS per table):**
- `rider_compensation_rules` — model enum, base/per-km/percent/min/max/peak bonus, `is_active`, created_by. Ops-only write, staff read.
- `rider_earnings` — delivery_id (unique, idempotent), rider_id, order_id, distance_km, customer_fee_ghs, earning_ghs, `rule_snapshot jsonb`, status enum, timestamps. Riders read only their own rows; ops write.
- `rider_earning_adjustments` — earning_id, delta_ghs, reason (NOT NULL), created_by, created_at.
- `rider_payouts` + `rider_payout_items` — amount, method enum, reference, period range, processed_by/at, notes; items link the earnings covered and flip them to Paid in one transaction.
- `cod_remittances` — delivery_id/order_id, rider, amount_due, cash_collected, amount_remitted, outstanding, confirmed_by/at.
- Validation triggers (not CHECK constraints) for non-negative amounts and legal earning-status transitions; earnings become immutable once Paid except through an adjustment row.

**Edge functions:**
- `rider-earnings` — accrues the earning inside the `delivered` path of `delivery-action` (service role, idempotent on `delivery_id`), so a retry can never double-pay.
- `rider-payouts` — approve / adjust / record payout / statement. Role-gated to admin + operations_manager, validated with Zod, rate-limited, every action written to `delivery_audit_log`.
- COD capture added to the rider's `delivered` action in `delivery-action`.

**Frontend:**
- `src/components/admin/RiderPayoutsPanel.tsx`, `CodReconciliationPanel.tsx`, compensation block in `DeliverySettingsPanel.tsx`, new tabs in `src/pages/admin/Deliveries.tsx`.
- Earnings tab and COD cash field in `src/pages/RiderPortal.tsx`.

**Safety:** all money maths server-side from database values; riders can never write earnings, payouts or customer amounts; ledger is append-only with adjustments rather than edits; unit tests for each compensation model plus an idempotency test for double-delivery events.
