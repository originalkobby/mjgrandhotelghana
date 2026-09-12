# Delivery system: what's built vs. what's still missing

I checked the food-delivery requirements against the live project. Most of the system is in place. Five items are genuinely missing or blocked.

## Built and working

- Delivery option in the food order flow, with map-based address picking, landmark, and delivery fee added to the order total.
- Server-side fee and delivery-time calculation (distance, base fee, per-km rate, minimum/maximum, peak-hour uplift, long-distance orders flagged for staff review) — prices cannot be tampered with from the browser.
- Delivery records with full status progression, a history log of every status change, and an audit log.
- Customer tracking page on a private link, showing order status, the hotel, the drop-off point and the rider's live position on the map, refreshing automatically.
- Rider portal: riders sign in, see assigned jobs, accept, pick up, mark on the way, and mark delivered; their phone shares live location while a job is active.
- Staff Deliveries screen: live-updating list, rider assignment, review approve/reject, status actions, cancellation.
- Automatic delivery emails at the key stages, protected against sending twice.
- Role permissions: admin and operations manager have full control, restaurant staff view and work orders, riders only see their own jobs, customers only their own order via the tracking link.
- Menu, cart, checkout, room bookings and the rest of the hotel site all still work; nothing was replaced.

## Missing or blocked

1. **Online payment for delivery orders (Paystack).** The checkout offers "Cash on delivery" and a second option labelled "Pay on collection at reception". There is no card/mobile-money payment for food yet — the existing Paystack connection only handles room bookings. Needs: a food-order payment step, a return-from-payment confirmation, and server-side verification before the order is marked paid.

2. **Rider management screen.** Riders can be assigned to deliveries, but there is no place for a manager to add a rider, edit their phone/vehicle, or deactivate them. There are currently **zero riders** in the system, so no delivery can actually be assigned today.

3. **Delivery settings screen.** Fees, distance limits, peak-hour uplift, preparation time, auto-assign and the on/off switch for deliveries are stored in the database but can only be changed by a developer. Settings currently only exposes the older "Delivery Zones" list.

4. **Delivery reporting.** No report of deliveries completed, average delivery time, fees earned, or rider performance, and no view of the audit trail.

5. **Google Maps account limits (outside the app).** Two things need action in the hotel's Google account:
   - Billing is not enabled on the Google Maps project, so maps show a billing error.
   - Address search is blocked for the current key, and live driving distance/time is refused, so the app falls back to straight-line distance. Address search should also be moved to run on our server rather than in the browser.

## Suggested order of work

1. Rider management screen (unblocks assignment immediately).
2. Delivery settings screen.
3. Paystack payment for food orders.
4. Delivery reporting and audit view.
5. Google account fixes plus server-side address search.

Approve and I'll start at the top, or tell me which of these you want first.
