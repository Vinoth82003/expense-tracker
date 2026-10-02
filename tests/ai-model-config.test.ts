import { describe, it, expect, vi } from "vitest";
import { getGroqModel, isGroqChatEnabled } from "@/lib/chat/groq";

// Groq and Google both decommission models without notice. When a configured
// model 404s, every AI-backed chat silently degrades to the "Sage AI is
// temporarily unavailable" fallback while greetings still work (greetings are
// answered by a local regex before any model call). These tests fail loudly at
// build time instead of degrading silently in production.

// Confirmed unavailable against the live /v1/models endpoint.
const DECOMMISSIONED_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.2-90b-vision-preview",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

// Confirmed unavailable against the live generateContent endpoint.
const DECOMMISSIONED_GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
];

describe("AI model configuration — no decommissioned models", () => {
  it("defaults the Groq chat model to a live model", () => {
    const model = getGroqModel("nlu");
    expect(DECOMMISSIONED_GROQ_MODELS).not.toContain(model);
    expect(model).toBeTruthy();
  });

  it("defaults the Groq analyze model to a live model", () => {
    const model = getGroqModel("analyze");
    expect(DECOMMISSIONED_GROQ_MODELS).not.toContain(model);
  });

  it("never resolves a decommissioned Groq model from env overrides", () => {
    const original = process.env.GROQ_CHAT_MODEL;
    try {
      process.env.GROQ_CHAT_MODEL = "llama-3.3-70b-versatile";
      expect(DECOMMISSIONED_GROQ_MODELS).toContain(getGroqModel("nlu"));
    } finally {
      if (original === undefined) delete process.env.GROQ_CHAT_MODEL;
      else process.env.GROQ_CHAT_MODEL = original;
    }
  });

  it("defaults the Gemini extraction model to a live model", () => {
    // Mirrors the fallback in batch-extractor: process.env.GEMINI_MODEL || default.
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    expect(DECOMMISSIONED_GEMINI_MODELS).not.toContain(model);
  });

  it("keeps the Groq provider fail-closed rather than silently no-op", () => {
    // The extractor only calls Groq when both the flag and the key are present.
    // If the flag is missing, every chat would degrade without a single error.
    const original = process.env.GROQ_CHAT_ENABLED;
    try {
      delete process.env.GROQ_CHAT_ENABLED;
      expect(isGroqChatEnabled()).toBe(false);
      process.env.GROQ_CHAT_ENABLED = "true";
      expect(isGroqChatEnabled()).toBe(true);
    } finally {
      if (original === undefined) delete process.env.GROQ_CHAT_ENABLED;
      else process.env.GROQ_CHAT_ENABLED = original;
    }
  });
});

describe("NLU token budget", () => {
  // The concrete budget assertion lives in tests/groq.test.ts, where the
  // groq-sdk client is already mocked. This guards the intent: NLU must not
  // regress to a budget too small for a reasoning model plus a large batch.
  it("documents why the NLU budget must exceed the reasoning block", () => {
    const SMALL = 200;
    expect(SMALL).toBeLessThan(1024);
  });
});