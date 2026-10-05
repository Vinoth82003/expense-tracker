import { describe, expect, it } from "vitest";

import { isInternalHref, parseInlineLinks } from "@/lib/chat/v2/inline-links";

/**
 * The visible text Sage renders is built from these segments, so a segmenting
 * bug is not a rendering detail — it is what the user reads. The regression
 * these guard: splitting with a capturing regex emitted the capture groups as
 * their own segments, so a reply read
 * "check your expense historyexpense history/expenses."
 */

describe("parseInlineLinks", () => {
  it("returns the whole string as one text segment when there is no link", () => {
    expect(parseInlineLinks("No links here.")).toEqual([
      { type: "text", value: "No links here." },
    ]);
  });

  it("emits exactly one link segment and never leaks the label or href as text", () => {
    const segments = parseInlineLinks(
      "For more details, check your [expense history](/expenses).",
    );

    expect(segments).toEqual([
      { type: "text", value: "For more details, check your " },
      { type: "link", label: "expense history", href: "/expenses", internal: true },
      { type: "text", value: "." },
    ]);

    // The exact shape of the reported bug.
    const rendered = segments
      .map((s) => (s.type === "text" ? s.value : s.label))
      .join("");
    expect(rendered).toBe("For more details, check your expense history.");
  });

  it("keeps a link adjacent to other punctuation-free text without swallowing it", () => {
    const segments = parseInlineLinks("a[x](/b)c[y](/d)e");

    expect(segments).toEqual([
      { type: "text", value: "a" },
      { type: "link", label: "x", href: "/b", internal: true },
      { type: "text", value: "c" },
      { type: "link", label: "y", href: "/d", internal: true },
      { type: "text", value: "e" },
    ]);
  });

  it("handles several links in one line", () => {
    const segments = parseInlineLinks(
      "check your [expense history](/expenses) and [income history](/income).",
    );

    expect(segments.filter((s) => s.type === "link")).toEqual([
      { type: "link", label: "expense history", href: "/expenses", internal: true },
      { type: "link", label: "income history", href: "/income", internal: true },
    ]);
  });

  it("handles a link at the very start and very end of the text", () => {
    expect(parseInlineLinks("[a](/x)")).toEqual([
      { type: "link", label: "a", href: "/x", internal: true },
    ]);
    expect(parseInlineLinks("tail [a](/x)")).toEqual([
      { type: "text", value: "tail " },
      { type: "link", label: "a", href: "/x", internal: true },
    ]);
  });

  it("marks external and protocol-relative targets as not internal", () => {
    const segments = parseInlineLinks(
      "[a](https://evil.example) [b](//evil.example) [c](/ok)",
    );

    const links = segments.filter((s) => s.type === "link");
    expect(links.map((l: any) => l.internal)).toEqual([false, false, true]);
  });

  it("trims whitespace inside the target", () => {
    const segments = parseInlineLinks("[a](  /expenses  )");

    expect(segments).toEqual([
      { type: "link", label: "a", href: "/expenses", internal: true },
    ]);
  });

  it("does not skip a leading link when called repeatedly", () => {
    // A shared /g regex keeps lastIndex between calls; a second call that
    // started at the stale offset would drop its first link.
    const line = "[a](/x) and [b](/y)";
    expect(parseInlineLinks(line)).toEqual(parseInlineLinks(line));
    expect(parseInlineLinks(line).filter((s) => s.type === "link")).toHaveLength(2);
  });

  it("leaves an unclosed bracket as plain text", () => {
    expect(parseInlineLinks("see [expense history](/expenses")).toEqual([
      { type: "text", value: "see [expense history](/expenses" },
    ]);
  });
});

describe("isInternalHref", () => {
  it("accepts root-relative paths only", () => {
    expect(isInternalHref("/expenses")).toBe(true);
    expect(isInternalHref("/income")).toBe(true);

    expect(isInternalHref("//evil.example")).toBe(false);
    expect(isInternalHref("https://evil.example")).toBe(false);
    expect(isInternalHref("javascript:alert(1)")).toBe(false);
    expect(isInternalHref("expenses")).toBe(false);
  });
});