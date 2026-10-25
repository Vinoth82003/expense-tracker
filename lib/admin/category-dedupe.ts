/**
 * Duplicate detection for category / subcategory names.
 *
 * The admin categories view needs to surface names that only differ by case,
 * whitespace, punctuation or the "&"/"and" spelling (e.g. "Food" vs "food",
 * or "Food & Dining" vs "Food and Dining"). Detection is deliberately
 * conservative — it only reports groups that normalize to the *same* key, so a
 * suggested duplicate is accurate and never a fuzzy false positive.
 */

/** Lowercases and strips punctuation so cosmetic variants compare equal. */
export function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export interface DuplicateGroup {
  /** The shared normalized form all `names` collapse to. */
  normalized: string;
  /** Distinct original spellings in this group (never a single name). */
  names: string[];
}

/**
 * Groups names that share a normalized form. Returns only groups with two or
 * more distinct spellings, largest first, then alphabetically for stability.
 */
export function findDuplicateGroups(names: readonly string[]): DuplicateGroup[] {
  const byKey = new Map<string, Set<string>>();

  for (const raw of names) {
    if (typeof raw !== "string") continue;
    const key = normalizeCategoryName(raw);
    if (!key) continue;
    const bucket = byKey.get(key) ?? new Set<string>();
    bucket.add(raw);
    byKey.set(key, bucket);
  }

  const groups: DuplicateGroup[] = [];
  for (const [normalized, bucket] of byKey) {
    if (bucket.size > 1) groups.push({ normalized, names: [...bucket] });
  }

  return groups.sort(
    (a, b) => b.names.length - a.names.length || a.normalized.localeCompare(b.normalized)
  );
}
