# Automatic Food Order Confirmation Emails

The confirmation email already exists in the code: placing an order on `/food-order` triggers the `send-food-order-email` function, which sends a branded MJ Grand Hotel email with the guest's name, reference code, order type, item lines, delivery details and total.

Two things stop it from actually reaching guests today:

1. **No email provider key is configured.** The project has no `RESEND_API_KEY` secret, so the function throws before sending. Every order silently fails to email.
2. **The email address is optional** on the order form, so guests can order without giving one and never receive a confirmation.

## What to change

### 1. Make sending work
- Add the `RESEND_API_KEY` secret (from your Resend account).
- Send from the hotel's verified domain (e.g. `MJ Grand Hotel <orders@mjgrandhotelghana.com>`) instead of the current `onboarding@resend.dev` test sender, so mail is trusted and not spam-filed. Requires the domain to be verified in Resend.

### 2. Make the email guaranteed and personalized
- Make the email field required on `/food-order` (it is currently optional), so every order has a recipient.
- Keep the greeting personal ("Hi {guest name}") and add the order-type-specific closing line: dine-in ("your table order is being prepared"), room service ("we'll bring it to Room X"), takeaway ("we'll notify you when it's ready for collection"), delivery ("we'll deliver to {zone / address}").
- Add estimated readiness wording and the hotel's restaurant contact number for changes.

### 3. Make failures visible
- Log a row-level failure to the console and surface a soft warning on the confirmation screen if the email call fails, instead of failing silently.
- Optionally send a copy of each order to the restaurant inbox so staff get notified alongside the dashboard.

## Technical details

- `supabase/functions/send-food-order-email/index.ts` — swap sender address, add order-type specific copy block, return non-throwing responses.
- `src/pages/FoodOrder.tsx` — mark email input `required`, validate format before submit, capture invoke error into state for the soft warning.
- Secret: `RESEND_API_KEY` via the secrets tool (never in code).

## Out of scope

- SMS notifications.
- Status-change emails (Ready / Out for delivery) — can be added later.
