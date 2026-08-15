# Match the Bookings table style on /admin/guests

Bring the Guests table in line with the Bookings table: header row and filters on the same line, locked column headings, vertical scrolling inside the table only, and alternating grey/white row striping starting from the first data row.

## Changes (src/pages/admin/Guests.tsx)

1. Page shell: change the outer wrapper from `space-y-6` to `flex-1 min-h-0 flex flex-col gap-6` so the table owns the vertical scroll (matching Bookings, which already works inside the admin shell).
2. Header row: place the "Guests" title/subtitle and the search + refresh + delete controls in one `flex flex-col md:flex-row md:items-start md:justify-between gap-4` container, same as Bookings.
3. Table card: `Card` becomes `flex flex-col flex-1 min-h-0`, `CardContent` becomes `flex flex-col flex-1 min-h-0 p-0`, and the scroll wrapper becomes `flex-1 min-h-0 overflow-auto` (replacing `overflow-x-auto`).
4. Locked headings: `<thead className="sticky top-0 z-10 bg-[hsl(var(--admin-surface))]">` so column headings stay fixed while rows scroll.
5. Striping: apply `bg-muted/40` when `i % 2 === 0` on data rows and on the loading skeleton rows, keep `border-b border-border/50` horizontal separators and `hover:bg-muted/60`, no vertical lines.

## Notes

- No changes to data fetching, VIP toggling, deletion, or the guest detail dialog.
- Column set stays as-is (Name, Email, Phone, VIP, Date, Actions plus the admin checkbox).

## Outcome

/admin/guests looks and behaves like /admin/bookings: aligned header controls, sticky headings, a single vertical scrollbar inside the table, and zebra striping from the first row.
