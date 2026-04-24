## Update Weekly Operations Panel Colors

In `src/pages/admin/Inventory.tsx`, update the progress bar fill colors in the Weekly Operations section to match the inventory grid's occupancy color palette for visual consistency:

- **Booked Rooms** bar: `bg-accent` → `bg-green-600` (matches "Full" status)
- **In (Check-ins)** bar: `bg-primary` → `bg-lime-500` (matches "Near Full" status)
- **Out (Check-outs)** bar: `bg-secondary-foreground` → `bg-orange-500` (matches "Low" occupancy status)

Track backgrounds (`bg-muted`) and accent icons remain unchanged.