import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ModeToggle from "@/components/ui/ModeToggle";

const h = createElement;
const base = {
  onChange: () => {},
  label: "Budget mode",
  labels: { off: "Free", on: "Budget" },
};

const render = (checked: boolean) =>
  renderToStaticMarkup(h(ModeToggle, { ...base, checked }));

/** Pulls a single inline-style declaration out of the rendered markup. */
const styleOf = (html: string, selectorIndex: number, prop: string) => {
  const spans = html.match(/style="[^"]*"/g) ?? [];
  const style = spans[selectorIndex] ?? "";
  const match = style.match(new RegExp(`${prop}:([^;"]+)`));
  return match?.[1];
};

describe("ModeToggle", () => {
  /**
   * Regression guard.
   *
   * The thumb was originally positioned with an arbitrary-value utility class
   * (`top-[3px]`). Tailwind's scanner did not emit that class, so the absolutely
   * positioned thumb had no `top` at all: it sat on the track's top edge and read
   * as a stray mark above the switch rather than as a knob. Geometry is therefore
   * asserted here as literal inline styles, not class names.
   */
  it("pins the thumb to a fixed box inside the track", () => {
    for (const checked of [false, true]) {
      const html = render(checked);
      // span 0 = track, span 1 = thumb.
      expect(styleOf(html, 1, "position")).toBe("absolute");
      expect(styleOf(html, 1, "top")).toBe("3px");
      // React serialises a zero length as `0`, not `0px`.
      expect(styleOf(html, 1, "left")).toBe("0");
      expect(styleOf(html, 1, "width")).toBe("18px");
      expect(styleOf(html, 1, "height")).toBe("18px");
      expect(styleOf(html, 1, "border-radius")).toBe("9999px");
      // A visible fill, or the knob is invisible against the track.
      expect(styleOf(html, 1, "background")).toBe("#ffffff");
      expect(styleOf(html, 1, "box-shadow")).toBeTruthy();
    }
  });

  it("parks the thumb left when off and right when on", () => {
    expect(styleOf(render(false), 1, "transform")).toBe("translateX(2px)");
    expect(styleOf(render(true), 1, "transform")).toBe("translateX(24px)");
  });

  it("keeps identical track and thumb dimensions in both states", () => {
    const off = render(false);
    const on = render(true);
    // Toggling must not reflow the surrounding text.
    expect(styleOf(on, 0, "width")).toBe(styleOf(off, 0, "width"));
    expect(styleOf(on, 0, "height")).toBe(styleOf(off, 0, "height"));
    expect(styleOf(on, 1, "width")).toBe(styleOf(off, 1, "width"));
    expect(styleOf(on, 1, "height")).toBe(styleOf(off, 1, "height"));
    expect(styleOf(off, 0, "width")).toBe("44px");
    expect(styleOf(off, 0, "height")).toBe("24px");
  });

  it("is grey when off and green when on", () => {
    expect(styleOf(render(false), 0, "background")).toBe("var(--bg-surface-variant)");
    expect(styleOf(render(true), 0, "background")).toBe("var(--color-success)");
  });

  it("exposes the state to assistive tech via role=switch", () => {
    const off = render(false);
    const on = render(true);
    expect(off).toContain('role="switch"');
    expect(off).toContain('aria-checked="false"');
    expect(on).toContain('aria-checked="true"');
    expect(off).toContain('aria-label="Budget mode"');
  });

  it("ties Free to the left/OFF state and Budget to the right/ON state", () => {
    // Each side is emphasized exactly when it is the active mode.
    expect(render(false)).toMatch(/font-semibold text-foreground">Free<\/span>/);
    expect(render(false)).toMatch(/text-muted">Budget<\/span>/);
    expect(render(true)).toMatch(/text-muted">Free<\/span>/);
    expect(render(true)).toMatch(/font-semibold text-foreground">Budget<\/span>/);
  });

  it("centres labels against the track and spaces them evenly", () => {
    const html = render(true);
    expect(html).toContain("items-center");
    expect(html).toContain("gap-3");
    // A predictable label box keeps the vertical alignment exact.
    expect(html).toContain("leading-none");
  });

  it("emits no pseudo-element or stray decorative node above the switch", () => {
    for (const checked of [false, true]) {
      const html = render(checked);
      expect(html).not.toContain("::");
      expect(html).not.toContain("before:");
      expect(html).not.toContain("after:");
      // Exactly two children inside the control: label, track, label.
      expect(html.match(/aria-hidden="true"/g)?.length).toBe(3);
    }
  });
});