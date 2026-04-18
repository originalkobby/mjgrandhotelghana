

## Goal
On the Spa Package card in `src/components/booking/AddOnsStep.tsx`, add an inline dropdown that lets the guest pick a massage treatment + duration (45/60/90 min) from the uploaded price list. The selected option drives the add-on price. Card visual size stays the same as the other add-on cards.

## Spa price list (from image, in GH₵)

| Treatment | 45 min | 60 min | 90 min |
|---|---|---|---|
| Neck and Shoulder | 450 | 670 | 900 |
| Swedish Massage | 450 | 670 | 900 |
| Deep Tissue | 450 | 670 | 900 |
| Thailand Oil | 480 | 720 | 950 |
| Thailand Traditional | 480 | 720 | 950 |
| Sports Massage | 500 | 750 | 1000 |
| Body Scrub | 500 | 750 | 1000 |
| Hot Stones | 500 | 750 | 1000 |
| Hot Oil | 500 | 750 | 1000 |
| Reflexology | 500 | 750 | 1000 |
| Therapeutic Massage | 500 | 750 | 1000 |
| Aromatherapy | 500 | 750 | 1000 |
| Herbal Ball | 600 | 900 | 1200 |
| Lotion Massage | 500 | 750 | 1000 |
| Couple Massage | 800 | 1200 | 1600 |
| Combo Massage | 800 | 1200 | 1600 |
| Four Hands Massage | 800 | 1200 | 1600 |
| Sauna | 250 (flat) | — | — |

Stored as a static `SPA_OPTIONS` const inside `AddOnsStep.tsx` flattened to `{ label: "Swedish Massage – 60 min", price_ghs: 670 }` entries. Sauna appears once with no duration.

## Implementation outline

1. **Detect the Spa Package card** by name (`addOn.name === "Spa Package"`) inside the `addOns.map`.
2. **Extract the card markup** into a small inline render so non-spa cards stay as `<motion.button>` (no behavior change), and the spa card becomes a `<motion.div>` to legally host an interactive `<select>`.
3. **Inside the spa card**, below the description and above the price line, add a compact native `<select>` (uses existing shadcn `Select` would push height; native select keeps height unchanged):
   - `h-8 text-xs w-full rounded-md border border-border bg-background px-2`
   - First option: "Choose treatment…" (disabled, value `""`).
   - Remaining options grouped by `<optgroup>` per treatment with 45/60/90 entries; Sauna as a flat option.
4. **Local state** `const [spaChoice, setSpaChoice] = useState<{ label: string; price_ghs: number } | null>(null)`.
5. **Click behavior on the spa card**: tapping the card body (outside the select) toggles selection only when a treatment has been picked. If `spaChoice` is null, show a tiny inline hint "Pick a treatment to add" instead of the Check toggle. The select's `onClick`/`onChange` use `e.stopPropagation()` so opening the dropdown does not toggle selection.
6. **Price display** in the spa card uses `spaChoice?.price_ghs ?? minSpaPrice` (250) so the card always shows a sensible "from" value; once a treatment is picked, it shows the exact price. Format: when no choice, prefix "From"; when chosen, show exact.
7. **Toggle integration**: when user clicks the spa card after a choice, call `onToggle({ id: addOn.id, name: \`Spa – ${spaChoice.label}\`, price_ghs: spaChoice.price_ghs, icon: addOn.icon })`. If `spaChoice` changes while the spa add-on is already selected, re-toggle so the booking total reflects the new price (toggle off then on with the new payload).
8. **Selection state lookup** for the spa card uses `selectedAddOns.some(a => a.id === addOn.id)` (unchanged), so the green check still appears.
9. **Size parity**: native `<select>` is `h-8`, replacing the previously empty space between description and price. The card's existing `p-5` padding and 2-line description clamp keep total height aligned with neighbors. Verified mentally against current 1116×682 viewport: spa card height matches the others.

## Files touched
- `src/components/booking/AddOnsStep.tsx` — add `SPA_OPTIONS` constant, branch render for `Spa Package`, dropdown + state + toggle wiring. No other files change.

## Out of scope
- No DB schema change (spa price list is static UI; the `add_ons.price_ghs` for "Spa Package" stays as a default/from-price).
- No edge function or `create-booking` changes — the chosen price flows through the existing add-on payload exactly like any other add-on price.
- Other add-on cards untouched.

