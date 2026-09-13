# Use “Customer” Across Food Orders and Delivery

## Goal
Replace remaining food-order and delivery wording that calls the buyer a “guest” with “customer,” without changing hotel-booking terminology or stored data.

## Changes
- Update the Rider compensation explanation to say the delivery fee the **customer** pays.
- Update the shared peak-window note to refer to the **customer** peak uplift.
- Clean up remaining food-order and delivery internal messages/comments so operational logs and maintenance language also use “customer.”
- Keep database fields such as `guest_name` unchanged to avoid breaking existing orders, integrations, or reports.
- Leave genuine hotel-stay wording unchanged, including the Guests dashboard, booking forms, guest messages, and room-availability notices.

## Verification
- Search the food-order and delivery areas again for visible uses of “guest.”
- Confirm the Deliveries settings page displays the revised Rider compensation wording.
- Run the focused TypeScript validation for the affected files.
