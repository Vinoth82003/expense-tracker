// PII scrubbing shared by every external-AI call (analyze route, V4 NLU/NLG).
// Extracted from the inline sanitizeNote used by /api/analyze so one source of
// truth covers all LLM payloads.

export function sanitizePii(note?: string | null): string {
  if (!note) return "";
  return note
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]")
    .replace(/\b\d{10,14}\b/g, "[PHONE]")
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[CARD]");
}
