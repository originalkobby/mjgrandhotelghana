# Premium Header Control Cluster

Restyle the right side of the admin top bar (currency toggle, FX rate text, notification bell) so it reads as one deliberate, premium control group instead of three loose items.

## What changes

### 1. One unified control rail
- Wrap the currency toggle, FX rate, and bell in a single softly-rounded translucent "rail" with a hairline gold border and subtle inner shadow, sitting on the taupe bar.
- Thin vertical gold-tinted dividers separate the three zones so they read as one instrument panel.

### 2. Currency toggle
- Segmented control look: gold pill slides behind the active option, inactive labels in cream at reduced opacity.
- Uppercase, wide letter-spacing, consistent height with the bell.
- Smooth 200ms transition on switch (no bounce).

### 3. FX rate readout
- Two-line editorial stack: tiny uppercase letter-spaced label "EXCHANGE RATE" above the value `1 USD = 12.50 GHS` in a slightly larger, tabular-figure treatment.
- Hidden below `md` to keep mobile clean; toggle and bell remain.

### 4. Notification bell
- Bell recoloured for the taupe bar (cream icon, gold hover) instead of the current muted/foreground tokens that were meant for light surfaces.
- Badge becomes a smaller gold-on-charcoal dot-count, aligned to the icon.
- Dropdown panel gets the warm cream surface, serif header, uppercase labels, and softer shadow to match the dashboard theme.

### 5. Spacing and alignment
- All three zones share one height and a common vertical centre line with the page title.
- Consistent gaps and padding so nothing looks tacked on.

## Technical notes
- Files: `src/pages/admin/AdminLayout.tsx` (header cluster markup/classes), `src/components/admin/NotificationBell.tsx` (trigger + panel styling), `src/index.css` if a small `admin-rail` utility token is needed.
- Colours stay on existing semantic tokens (`--admin-bar`, `--accent`/gold, `--cream`); no hardcoded colour classes.
- Purely presentational — currency logic, rate value, and notification behaviour untouched.

## Out of scope
- The sidebar, page content, and the fixed 12.5 rate logic.
