# Order Emails Tied to Staff Actions

Guests currently get their confirmation email the instant they submit the order form, before the restaurant has seen it. This moves the email to the moment staff confirm the order, and adds a second email when the order is on its way.

## 1. Confirmation fires on staff confirmation

- Remove the automatic email send from the public order page. After submitting, the guest sees "Order received — we'll email your confirmation once the restaurant accepts it" plus their reference code.
- When a staff member moves an order to **Confirmed** on the dashboard, the confirmation email is sent automatically (same branded design as today: greeting by first name, reference, order type wording, item list, total, timing estimate, restaurant phone).
- The email is sent once per order, even if staff toggle statuses back and forth.
- If sending fails, staff see a small warning toast; the status change still goes through.

## 2. "Out for delivery" becomes "On its way" with its own email

- Rename the status label everywhere on the dashboard (badge, filter list, action button) to **On its way**. The stored status value stays the same, so existing orders are unaffected.
- Clicking it sends a second, separate email to the guest: a rider/driver-style dispatch notice — personalised greeting, "Your order is on its way", reference code, delivery address and landmark, item summary and total due on delivery, an estimated arrival window, and the restaurant number to call. Same MJ Grand Hotel branding as the confirmation.
- This email is sent once per order too.

## Technical details

- Add a `stage` parameter (`confirmed` | `on_the_way`) to `supabase/functions/send-food-order-email/index.ts`; branch subject line and body copy from one shared branded layout. Guard against duplicate sends with two nullable timestamp columns on `food_orders` (`confirmation_email_sent_at`, `dispatch_email_sent_at`) set by the function via service role.
- Migration: add the two timestamp columns.
- `src/pages/admin/FoodOrders.tsx`: in `updateStatus`, after a successful update, invoke the function with the matching stage when the new status is `confirmed` or `out_for_delivery`; update `STATUS_LABELS.out_for_delivery` to "On its way".
- `src/pages/FoodOrder.tsx`: drop the invoke and the `emailWarning` branch; adjust the confirmation copy.
- Email field stays required; sender stays `restaurant@mjgrandhotelghana.com` (overridable via `RESEND_FROM_EMAIL`).

## Out of scope

- SMS notifications and emails for Ready / Completed / Cancelled statuses.
