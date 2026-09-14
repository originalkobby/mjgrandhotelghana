export type SizePrice = { key: string; label: string; price: number };

const SIZE_LABELS: Record<string, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
};

/**
 * Parses menu price strings that carry multiple sizes, e.g.
 * "M: GH₵ 150 / L: GH₵ 200" or "L: GH₵ 200 / M: GH₵ 150".
 * Returns [] for ordinary single-price strings.
 */
export function parseSizePrices(value: string): SizePrice[] {
  if (!value) return [];
  const out: SizePrice[] = [];
  const re = /([A-Za-z]+)\s*:\s*GH₵?\s*([\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value))) {
    const key = m[1].toUpperCase();
    const price = Number(m[2]);
    if (Number.isFinite(price) && price > 0) {
      out.push({ key, label: SIZE_LABELS[key] ?? m[1], price });
    }
  }
  return out.length >= 2 ? out : [];
}

/** Splits "Dish name (Medium)" into its base name and size label. */
export function extractSizeFromName(name: string): { base: string; sizeLabel: string | null } {
  const m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(name.trim());
  if (!m || !m[1].trim()) return { base: name.trim(), sizeLabel: null };
  return { base: m[1].trim(), sizeLabel: m[2].trim() };
}
