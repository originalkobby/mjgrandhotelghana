# Remove duplicate customer fields from the food-order page

## Goal
Remove the visible **Your name**, **Email**, and **Phone** fields from `/food-order`. Every order will automatically use the customer details collected by the mandatory first-time form on that device.

## Changes

### 1. Use the saved customer identity automatically
- Keep the existing first-time customer form as the only place where Name, Email, and Phone are entered.
- When `/food-order` opens, load the saved customer details from the device and retain them internally for the order.
- If no valid saved details exist, keep the non-dismissible first-time form open until all three fields are valid and saved.

### 2. Remove the duplicate fields from the order page
- Remove the visible Name, Phone, and Email inputs and their supporting email text from the order form.
- Keep room number, delivery location, payment, notes, quantity, and all other order controls unchanged.

### 3. Preserve customer details across the system
- Continue sending the saved name, email, phone, and device identity with every order.
- Keep the existing server validation and storage unchanged so the details still populate Food Orders, Customers, confirmation emails, delivery contact information, Paystack, and customer tracking workflows.
- Keep order submission disabled until valid saved customer details are available, preventing incomplete customer records.
- Continue personalising the success message and confirmation destination with the saved customer details.

## Verification
- Test a first-time device: the mandatory form appears, cannot be dismissed, and completing it enables ordering without duplicate fields.
- Test a returning device: `/food-order` opens directly with no customer fields and places the order using the saved details.
- Confirm dine-in, room service, takeaway, delivery, and payment flows still receive the customer’s name, email, and phone.
- Run the existing TypeScript checks and relevant food-order tests.

## Out of scope
- No database or access-policy changes.
- No changes to the Customers dashboard, customer export, pricing, delivery logic, or email timing.
