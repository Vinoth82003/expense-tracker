/**
 * Canonical URL-slug handling for the documentation CMS.
 *
 * Slugs are stored normalized so that "Getting Started", "getting-started" and
 * "getting_started" cannot coexist as three records that resolve to one URL.
 * Nested slugs are supported with "/" separators (e.g. "guides/expenses").
 */

const MAX_SLUG_LENGTH = 200;

export function normalizeSlug(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-/]/g, "")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^[-/]+|[-/]+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length > MAX_SLUG_LENGTH) return false;
  return /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(slug);
}
