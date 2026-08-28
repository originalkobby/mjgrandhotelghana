# Add Green "ORDER NOW" CTA to Menu Item Cards

## Goal
Replace the existing low-contrast "+ ORDER" / "Order" text on every menu item card with a prominent green button that reads "ORDER NOW".

## What changes

### 1. `src/components/MenuSection.tsx`
- Replace the current `<span className="... group-hover:text-gold ..."><Plus className="w-3 h-3" /> Order</span>` with a compact green button element.
- The button should:
  - Use a green background (e.g., `bg-green-600` / `bg-emerald-600`) and white text.
  - Read "ORDER NOW" in uppercase, small bold text.
  - Keep the existing hover scale on the card and remain clickable via the surrounding `<Link>`.
  - Match the dark luxury theme without clashing with the gold/cream palette.

### 2. `src/pages/Menu.tsx`
- Apply the same green "ORDER NOW" button in the `CompactSection` component, replacing the plain "Order" text.
- Ensure consistent styling with the full `MenuSection` cards.

## Out of scope
- No changes to navigation, routing, or order-form logic.
- No new functionality beyond the visual CTA update.
