# Dashboard Restyle — Warm Editorial Luxury

Bring the admin dashboard's look in line with the public site shown in the reference: warm beige/cream background, muted taupe surfaces, soft gold accents, Playfair Display headings, and generous letter-spaced uppercase labels.

## What changes

### 1. Dashboard colour surfaces
- Admin background becomes the warm sand tone from the reference (the site's existing beige `--background`) instead of the default grey-white.
- Cards, tables, and panels sit on a slightly lighter cream surface with soft warm borders — no cool greys anywhere in the dashboard.
- Sidebar switches from the current neutral grey theme to a warm taupe/charcoal panel with cream text and gold active states, echoing the reference navbar.

### 2. Header
- Keep the current height and controls, but restyle the top bar as a warm taupe band with cream text, matching the reference site's navbar.
- "Booking Command Center" title in Playfair Display; currency toggle restyled with the gold accent for the active option.

### 3. Typography and labels
- Section headings and page titles in Playfair Display.
- Table column headers and small labels in uppercase with wide letter spacing and muted warm-grey colour, like "CONTACT" / "YOUR NAME" in the reference.
- Body text stays DM Sans.

### 4. Buttons and inputs
- Primary/outline buttons adopt the reference's thin gold-bordered, transparent style with gold uppercase letter-spaced text (as in "SEND INQUIRY" and "BOOK NOW").
- Inputs in dialogs adopt a lighter, warm-bordered treatment; the underline style from the reference is used only for the simplest single-line fields, boxed inputs stay boxed for data-heavy admin forms.

### 5. Consistency
- Status badges, charts, and accents recoloured to the warm palette (gold, sage/olive, terracotta, muted charcoal) instead of the current saturated blues/greens where they clash.
- Dark mode keeps working; the warm tokens have dark equivalents.

## Technical notes
- All colour work goes through the sidebar and admin tokens in `src/index.css` (the `--sidebar-*` variables are currently cool grey and get warm values). No hardcoded colour classes in components.
- Touch points: `src/index.css`, `src/pages/admin/AdminLayout.tsx`, `src/components/admin/AdminSidebar.tsx`, plus light class-level passes on the admin pages for heading/label styling.
- Purely presentational — no changes to data fetching, roles, or business logic.

## Out of scope
- The public-facing pages already use this palette and stay untouched.
- No layout restructuring of dashboard modules.
