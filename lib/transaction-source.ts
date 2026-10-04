/**
 * Transaction provenance — "who entered this row".
 *
 * `entrySource` is deliberately derived from the SERVER code path that creates
 * a transaction, never from the request body. If the client could pick the
 * value, any caller could label its own writes "By Sage", which would make the
 * tag meaningless for the audit trail it exists to provide.
 *
 *   MANUAL -> the user typed it in the app UI  ("By you")
 *   SAGE   -> Sage (the chat assistant) wrote it ("By Sage")
 *
 * Note this is unrelated to `Income.source`, which is the income *origin*
 * (Salary / Freelance / Investment / Gift / Others).
 *
 * This module must stay isomorphic: it is imported by client components, so it
 * must not pull in anything server-only. Resolving the provenance of an inbound
 * request lives in `lib/transaction-source.server.ts` instead.
 */

export const ENTRY_SOURCE = {
  MANUAL: "MANUAL",
  SAGE: "SAGE",
} as const;

export type EntrySource = (typeof ENTRY_SOURCE)[keyof typeof ENTRY_SOURCE];

export const ENTRY_SOURCE_VALUES: EntrySource[] = [
  ENTRY_SOURCE.MANUAL,
  ENTRY_SOURCE.SAGE,
];

/** User-facing labels. "By you" reads better than "Manual" in a list. */
export const ENTRY_SOURCE_LABELS: Record<EntrySource, string> = {
  MANUAL: "By you",
  SAGE: "By Sage",
};

const isEntrySource = (value: unknown): value is EntrySource =>
  value === ENTRY_SOURCE.MANUAL || value === ENTRY_SOURCE.SAGE;

/**
 * Coerce anything (including `undefined` from a document written before the
 * column existed, or a malformed value) into a valid EntrySource.
 * Unknown values fall back to MANUAL rather than rendering a blank badge.
 */
export const normalizeEntrySource = (value: unknown): EntrySource =>
  isEntrySource(value) ? value : ENTRY_SOURCE.MANUAL;

export const getEntrySourceLabel = (value: unknown): string =>
  ENTRY_SOURCE_LABELS[normalizeEntrySource(value)];