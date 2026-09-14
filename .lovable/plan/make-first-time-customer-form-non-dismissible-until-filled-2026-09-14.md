# Make first-time customer form non-dismissible until filled

## Goal
The first-time customer dialog (Name, Email, Phone) shown on "Order Now" must not be cancellable. Remove the X close icon and block all other dismissal paths (Escape key, clicking the backdrop) so the customer must fill the form and tap **Continue to order** to proceed.

## Changes

### 1. `src/components/ui/dialog.tsx` — add a `hideClose` option to `DialogContent`
The X close button is currently hardcoded into the shared `DialogContent`. Add an optional `hideClose?: boolean` prop. When `true`, the `DialogPrimitive.Close` (X icon) is not rendered. All other dialogs keep the X by default, so nothing else in the app changes.

### 2. `src/components/food/CustomerDetailsDialog.tsx` — make the form non-dismissible
- Pass `hideClose` to `DialogContent`.
- Pass `onEscapeKeyDown={(e) => e.preventDefault()}` so pressing Escape does nothing.
- Pass `onInteractOutside={(e) => e.preventDefault()}` so clicking the dark backdrop does nothing.
- Guard `onOpenChange` so the dialog only closes when the customer has successfully saved (the `onSaved` callback already closes it). A guard like `if (!open && !allowClose) return;` blocks external close attempts.

No other files change — both call sites (Menu gate + direct `/food-order` access) already use this component, so both get the behavior automatically.

## Out of scope
- No change to validation, fields, save logic, or the customer-capture database flow.
- No change to any other dialog in the app.
