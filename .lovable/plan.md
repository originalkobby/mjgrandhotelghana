# Match the dollar symbol to the cedi symbol

## Problem

The USD button uses a Lucide `DollarSign` icon while the GH₵ button uses a plain text character. Shrinking the icon (12px to 10px) does not make them look the same, because an icon is a drawn stroke shape and the cedi is a typographic glyph at 11px — different weight, baseline, and optical size. Further shrinking the icon will only make it look thin, not matched.

## Solution

Replace the icon with the text character `$` so both currency symbols are rendered by the same font at the same size and weight.

## Technical details

In `src/pages/admin/AdminLayout.tsx`:
- Remove the `DollarSign` import from `lucide-react`.
- In the USD button, replace `<DollarSign className="w-2.5 h-2.5" />` with a text `$` sharing the button's `text-[11px]` sizing (dropping the now-unneeded `gap-1` icon spacing so the `$ USD` label spaces naturally).
- Leave the GH₵ button untouched.

Result: `$ USD` and `GH₵` render at identical size, weight, and baseline in the admin header rail.
