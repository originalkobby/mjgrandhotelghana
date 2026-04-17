
The user wants to add a "room number" field to the room creation/edit form in the admin dashboard. Let me explore the current Rooms admin page and the rooms table schema.

Looking at the schema:
- `rooms` table has: id, name, slug, description, base_price_ghs, bed_type, size_sqm, max_adults, max_children, amenities, images, is_active, sort_order
- There's no `room_number` column on the `rooms` table currently
- The `bookings` table has a `room_number` field (text), but that's per-booking assignment

Important consideration: A "room type" (e.g., Deluxe Suite) can have multiple physical rooms (101, 102, 103). The current `rooms` table represents room *types*, with `room_inventory.total_count` tracking how many physical units exist per type per date. So there are two interpretations:

1. **Single room number** — add one `room_number` text column to `rooms` (simple, but limiting if a type has multiple units)
2. **Multiple room numbers** — add `room_numbers text[]` array column so each room type can list its physical units (e.g., `['101','102','103']`)

Option 2 aligns with how `total_count` already works in inventory. I should ask the user which they want before building.

Actually, the user said "the room number" (singular) and mentioned "tracking inventory and room availability". Given the inventory system already supports multiple units per type via `total_count`, a list of room numbers is more meaningful. But I'll ask to be safe.

## Plan: Add Room Number(s) to Room Form

### Database
- Add a new `room_numbers text[]` column (default `'{}'`) to the `rooms` table via migration. Array supports room types with multiple physical units (e.g., Deluxe has rooms 201, 202, 203).

### Admin Form (`src/pages/admin/Rooms.tsx`)
- Add a "Room Numbers" input to the dialog form (comma-separated entry, same UX pattern as Amenities).
- Include `room_numbers` in `emptyForm`, `openEdit`, and the insert/update mutation payload (split by comma, trim, filter empty).
- Add a "Rooms" column to the table listing showing the room numbers as small badges (or comma-separated text).

### No changes needed to
- Booking flow (bookings already have their own `room_number` text field for assignment).
- Inventory logic (`total_count` continues to track availability count).

### Optional follow-up (not in this plan)
- Auto-suggesting available room numbers when assigning a booking, drawn from the room type's `room_numbers` list.
