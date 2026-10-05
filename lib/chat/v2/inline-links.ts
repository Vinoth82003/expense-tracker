/**
 * Inline Markdown link parsing for chat copy.
 *
 * Sage's replies embed internal links as `[label](/path)`. Turning that into DOM
 * is a rendering concern, but the splitting is not — and getting it wrong is
 * visible to the user, so it lives here as plain text in, plain segments out.
 *
 * This deliberately does *not* use `String.split` with a capturing regex:
 * split() also emits every capture group as its own array entry, so
 * "[expense history](/expenses)" came back as five pieces and rendered as
 * "expense historyexpense history/expenses".
 */

export type InlineSegment =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string; internal: boolean };

const INLINE_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Same-origin, root-relative only. Sage's copy is model-authored, so a target is
 * never trusted into the DOM without this check — `javascript:`, protocol
 * relative `//host`, and absolute URLs all fall back to plain label text.
 */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/** Splits text into alternating plain-text and link segments. */
export function parseInlineLinks(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Scanned with an explicit cursor because a regex lastIndex left over from a
  // previous call would silently skip the first link in this one.
  INLINE_LINK.lastIndex = 0;

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_LINK.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, match.index) });
    }

    const label = match[1];
    const href = match[2].trim();
    segments.push({ type: "link", label, href, internal: isInternalHref(href) });

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }

  return segments;
}