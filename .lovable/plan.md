# Show “My Current Location” on Mobile

## Goal
Keep the current-location control visible on phones exactly in the selected delivery-address row, with the full label **“My Current Location”** displayed.

## Changes
- Update the current-location button in the delivery address picker to use the label **“My Current Location.”**
- Remove the mobile-only hiding rule currently applied to the label.
- Keep the location icon, loading indicator, and existing location-detection behaviour unchanged.
- Adjust the search-and-location row only as needed so both controls fit cleanly on narrow screens without overlap or clipped text.

## Validation
- Check the food-order page at mobile width.
- Confirm the complete label is visible before and during normal use.
- Confirm tapping the button still requests and applies the customer’s current location.
- Confirm the desktop layout remains intact.
