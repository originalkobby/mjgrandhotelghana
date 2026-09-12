# Delivery money-flow audit — three accounting layers

## Audit result (verified in code)

All three layers are built and live under **Admin → Deliveries**:

**1. Customer transaction — what the customer pays the hotel**
- `food_orders.total_ghs`, `payment_method` (Paystack / cash on delivery), `payment_status`, `paid_at`.
- Cash Reconciliation tab splits daily sales into "Cash on delivery" and "Paystack" cards, with a combined "Total customer sales".

**2. Delivery revenue — what the hotel charges for delivery**
- `deliveries.fee_ghs` + `fee_breakdown` (server-side priced).
- Cash Reconciliation shows "Hotel delivery revenue" = delivery fees collected minus rider earnings accrued, per selected day.

**3. Rider compensation — what the hotel owes riders**
- `rider_earnings` (immutable once paid, status state machine, one earning per delivery), `rider_earning_adjustments` (reason mandatory), `rider_payouts` + `rider_payout_items` (no double-pay, enforced by unique item rows), `cod_remittances` for cash riders hold.
- Payouts tab: "Rider earnings accrued", "Rider payouts", "Outstanding rider balance" — answers "how much do we owe riders?" for any chosen date.
- Riders see only their own earnings in the Rider Portal; hotel margin is never exposed to them.

So management can already answer: **"How much did we make from delivery today, and how much do we owe riders?"** via Deliveries → Cash (date picker at top).

## Optional improvement (only if approved)

Add a one-line **Daily Delivery P&L summary strip** at the top of the Cash Reconciliation tab:
`Sales GH₵X · Delivery fees GH₵Y · Rider cost GH₵Z · Net delivery margin GH₵(Y−Z) · Owed to riders GH₵W`
— pure display change in `src/components/admin/CashReconciliationPanel.tsx`, reusing totals already computed there. No database or logic changes.

## Technical details
- Files touched (improvement only): `src/components/admin/CashReconciliationPanel.tsx`.
- No migrations, no edge-function changes, no new invocations.
