

## Goal
Recolor the booking source badges so all 8 sources flow visually from green → blue → purple, with `Direct` at green and `STAAH` at purple.

## Spectrum mapping (8 sources)
| # | Source key | Label | Tailwind classes |
|---|---|---|---|
| 1 | `direct` | Direct | `bg-green-500/15 text-green-700 border-green-500/30` |
| 2 | `booking_com` | Booking.com | `bg-emerald-500/15 text-emerald-700 border-emerald-500/30` |
| 3 | `expedia` | Expedia | `bg-teal-500/15 text-teal-700 border-teal-500/30` |
| 4 | `airbnb` | Airbnb | `bg-cyan-500/15 text-cyan-700 border-cyan-500/30` |
| 5 | `agoda` | Agoda | `bg-sky-500/15 text-sky-700 border-sky-500/30` |
| 6 | `siteminder` | SiteMinder | `bg-blue-500/15 text-blue-700 border-blue-500/30` |
| 7 | `cloudbeds` | Cloudbeds | `bg-indigo-500/15 text-indigo-700 border-indigo-500/30` |
| 8 | `staah` | STAAH | `bg-purple-500/15 text-purple-700 border-purple-500/30` |

This creates a smooth green → teal/cyan → blue → indigo → purple transition.

## Single edit
**File:** `src/pages/admin/Bookings.tsx`, lines 103–108 — replace the `SOURCE_COLORS` map with all 8 entries above.

## Out of scope
- No change to `SOURCE_LABELS`, status colors, or filtering logic.

