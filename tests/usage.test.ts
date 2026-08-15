import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate, mockCreatedWith } = vi.hoisted(() => {
  const mockCreate = vi.fn().mockResolvedValue({});
  return {
    mockCreate,
    mockCreatedWith: (input: Record<string, unknown>) => {
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining(input),
      });
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: { aiUsageLog: { create: mockCreate } },
}));

import { estimateCostUsd, logAiUsage } from "@/lib/chat/ai/usage";

describe("estimateCostUsd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes cost from token rates", () => {
    const cost = estimateCostUsd(1000, 1000);
    expect(cost).toBeCloseTo(0.00059 + 0.00079, 8);
  });

  it("handles zero tokens", () => {
    expect(estimateCostUsd(0, 0)).toBe(0);
  });

  it("handles fractional and negative-safety inputs", () => {
    expect(estimateCostUsd(-5, 250)).toBeCloseTo((250 / 1000) * 0.00079, 8);
  });
});

describe("logAiUsage", () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it("persists a usage row with computed cost", () => {
    logAiUsage({
      userId: "u1",
      callType: "nlu",
      intent: "add_expense",
      promptTokens: 1000,
      outputTokens: 500,
      latencyMs: 120,
    });

    mockCreatedWith({
      userId: "u1",
      callType: "nlu",
      intent: "add_expense",
      promptTokens: 1000,
      outputTokens: 500,
      latencyMs: 120,
      fallbackUsed: false,
      costUsd: estimateCostUsd(1000, 500),
    });
  });

  it("marks fallbackUsed for fallback events", () => {
    logAiUsage({
      userId: "u1",
      callType: "nlg",
      intent: "query_expense",
      fallbackUsed: true,
    });

    mockCreatedWith({ fallbackUsed: true });
  });

  it("never throws when persistence fails", () => {
    mockCreate.mockRejectedValueOnce(new Error("db down"));
    expect(() =>
      logAiUsage({ userId: "u1", callType: "analyze", intent: null }),
    ).not.toThrow();
  });
});
