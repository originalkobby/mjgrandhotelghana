# Match the Bookings table style on /admin/menu

Bring the Menu Management page in line with the Bookings/Guests tables: one single table with locked column headings, in-table vertical scrolling, zebra striping, and columns that stay aligned across every category.

## Changes (src/pages/admin/MenuManagement.tsx)

1. Page shell: outer wrapper becomes `flex-1 min-h-0 flex flex-col gap-6`, so only the table scrolls.
2. Header row: title, item count badge, category filter, refresh, and Add Item stay on one line (`flex flex-col md:flex-row md:items-start md:justify-between gap-4`).
3. Single table instead of one Card + Table per category. Categories become full-width header rows inside the same table body (`<tr><td colSpan={5}>Category name</td></tr>`), so Item / Description / Price / Status / Actions columns line up across all categories.
4. Card becomes `flex flex-col flex-1 min-h-0`; CardContent `flex flex-col flex-1 min-h-0 p-0`; scroll wrapper `flex-1 min-h-0 overflow-auto`.
5. Locked headings: `<thead className="sticky top-0 z-20 bg-[hsl(var(--admin-surface))]">` with uppercase tracked column labels matching Bookings.
6. Striping: alternating `bg-muted/40` applied to data rows using a running index that continues across categories, `border-b border-border/50` horizontal separators only, `hover:bg-muted/60`. Category header rows keep a solid surface background and stick just under the header (`sticky top-[Xpx] z-10`) so stripes never show through.
7. Empty state stays as a single centered row inside the table.

## Notes

- No change to data fetching, add/edit/delete logic, the dialog, or the category filter behaviour.
- Column widths fixed via header cell widths so every category shares identical alignment.

## Outcome

/admin/menu looks and behaves like /admin/bookings: aligned header controls, sticky column headings, one vertical scrollbar inside the table, zebra striping, and perfectly aligned columns across all categories.
