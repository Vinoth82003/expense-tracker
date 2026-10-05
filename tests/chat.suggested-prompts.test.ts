import { describe, expect, it } from "vitest";

import { detectProcessingIntent } from "@/lib/chat/loading-messages";
import {
  SUGGESTED_PROMPT_COUNT,
  SUGGESTED_PROMPT_SPECS,
  SUPPORTED_PROMPT_KINDS,
  SUPPORTED_QUERY_KINDS,
  expectedQueryKind,
  pickSuggestedPrompts,
  requiresAmount,
} from "@/lib/chat/suggested-prompts";

/**
 * The earlier prompt list shipped suggestions that routed nowhere — "top
 * spending categories" had no ranking report behind it and answered with a flat
 * total. These tests make that class of bug impossible to reintroduce: every
 * declared kind must map to a query kind the executor can actually answer, and
 * every prompt must be classified into the narration it claims.
 */
describe("SUGGESTED_PROMPT_SPECS", () => {
  it("declares a kind the codebase supports", () => {
    for (const spec of SUGGESTED_PROMPT_SPECS) {
      expect(SUPPORTED_PROMPT_KINDS).toContain(spec.kind);
    }
  });

  it("maps every query prompt to a query kind the executor supports", () => {
    // This is the assertion that catches a dead-end suggestion.
    for (const spec of SUGGESTED_PROMPT_SPECS) {
      const queryKind = expectedQueryKind(spec);
      if (queryKind === null) continue;
      expect(SUPPORTED_QUERY_KINDS).toContain(queryKind as any);
    }
  });

  it("has a unique id for every prompt", () => {
    const ids = SUGGESTED_PROMPT_SPECS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty, unique copy for every prompt", () => {
    const texts = SUGGESTED_PROMPT_SPECS.map((s) => s.text);
    for (const text of texts) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("classifies every prompt into the narration it declares", () => {
    // If this fails, the user taps a prompt and watches the wrong work narrate.
    for (const spec of SUGGESTED_PROMPT_SPECS) {
      expect(detectProcessingIntent(spec.text)).toBe(spec.intent);
    }
  });

  it("always states a date on a write prompt, so one tap completes the flow", () => {
    // A dateless suggestion is a legitimate question but a poor button: it
    // would immediately open the date prompt instead of showing the feature.
    for (const spec of SUGGESTED_PROMPT_SPECS) {
      if (spec.kind !== "add_expense" && spec.kind !== "add_income") continue;
      expect(spec.text).toMatch(/today|yesterday|\d{4}-\d{2}-\d{2}/i);
    }
  });

  it("states an amount on every prompt that requires one", () => {
    for (const spec of SUGGESTED_PROMPT_SPECS) {
      if (!requiresAmount(spec)) continue;
      expect(spec.text).toMatch(/₹\s?[\d,]+/);
    }
  });

  it("does not offer a category breakdown for a category with no report", () => {
    // Guards the original regression explicitly.
    for (const spec of SUGGESTED_PROMPT_SPECS) {
      expect(spec.text.toLowerCase()).not.toMatch(/top spending|biggest category|breakdown of/);
    }
  });
});

describe("pickSuggestedPrompts", () => {
  it("returns the requested number of prompts", () => {
    expect(pickSuggestedPrompts()).toHaveLength(SUGGESTED_PROMPT_COUNT);
  });

  it("never repeats a prompt within one selection", () => {
    const picked = pickSuggestedPrompts(8);
    expect(new Set(picked.map((p) => p.id)).size).toBe(picked.length);
  });

  it("only ever returns prompts from the catalogue", () => {
    const known = new Set(SUGGESTED_PROMPT_SPECS.map((s) => s.id));
    for (const spec of pickSuggestedPrompts(SUGGESTED_PROMPT_COUNT)) {
      expect(known.has(spec.id)).toBe(true);
    }
  });

  it("varies the selection across refreshes", () => {
    // A refresh that always returns the same five prompts is not a refresh.
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      seen.add(pickSuggestedPrompts().map((p) => p.id).join("|"));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("clamps a nonsensical count instead of throwing", () => {
    expect(pickSuggestedPrompts(-5)).toEqual([]);
    expect(pickSuggestedPrompts(0)).toEqual([]);
  });

  it("does not mutate the catalogue", () => {
    const before = SUGGESTED_PROMPT_SPECS.map((s) => s.id);
    pickSuggestedPrompts(3);
    expect(SUGGESTED_PROMPT_SPECS.map((s) => s.id)).toEqual(before);
  });
});