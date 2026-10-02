import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSettingsFindMany, mockAiUsageLogCount } = vi.hoisted(() => ({
  mockSettingsFindMany: vi.fn(),
  mockAiUsageLogCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: { findMany: mockSettingsFindMany },
    aiUsageLog: { count: mockAiUsageLogCount },
  },
}));

import { checkAiAccess, DEFAULT_FEATURE_FLAGS } from "@/lib/ai/access";

function settings(flags: Record<string, unknown> | null, ai?: Record<string, unknown>) {
  const rows: Array<{ key: string; value: string }> = [];
  if (flags) rows.push({ key: "featureFlags", value: JSON.stringify(flags) });
  if (ai) rows.push({ key: "aiSettings", value: JSON.stringify(ai) });
  return rows;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAiUsageLogCount.mockResolvedValue(0);
});

describe("checkAiAccess — feature kill-switch", () => {
  it("allows chat when the flag row is absent entirely", async () => {
    mockSettingsFindMany.mockResolvedValue([]);
    await expect(checkAiAccess("u1", "chat")).resolves.toEqual({ allowed: true });
  });

  it("allows chat when a legacy row predates the chatAssistant flag", async () => {
    mockSettingsFindMany.mockResolvedValue(
      settings({ aiAnalysis: true, pdfExport: true }),
    );
    await expect(checkAiAccess("u1", "chat")).resolves.toEqual({ allowed: true });
  });

  it("blocks chat with 403 when chatAssistant is off", async () => {
    mockSettingsFindMany.mockResolvedValue(settings({ chatAssistant: false }));
    const res = await checkAiAccess("u1", "chat");
    expect(res.allowed).toBe(false);
    if (!res.allowed) {
      expect(res.status).toBe(403);
      expect(res.error).toMatch(/Sage Assistant is currently disabled/);
    }
  });

  it("blocks analyze with 403 when aiAnalysis is off", async () => {
    mockSettingsFindMany.mockResolvedValue(settings({ aiAnalysis: false }));
    const res = await checkAiAccess("u1", "analyze");
    expect(res.allowed).toBe(false);
    if (!res.allowed) expect(res.status).toBe(403);
  });

  it("keeps chat and analyze independent", async () => {
    mockSettingsFindMany.mockResolvedValue(settings({ chatAssistant: false }));
    await expect(checkAiAccess("u1", "analyze")).resolves.toEqual({ allowed: true });
  });

  it("falls back to defaults when the stored value is not valid JSON", async () => {
    mockSettingsFindMany.mockResolvedValue([
      { key: "featureFlags", value: "{not json" },
    ]);
    await expect(checkAiAccess("u1", "chat")).resolves.toEqual({ allowed: true });
  });
});

describe("checkAiAccess — daily chat quota", () => {
  it("is unlimited when maxChatCalls is unset or zero", async () => {
    mockSettingsFindMany.mockResolvedValue(settings({}, {}));
    await expect(checkAiAccess("u1", "chat")).resolves.toEqual({ allowed: true });
    await expect(checkAiAccess("u1", "chat")).resolves.toEqual({ allowed: true });
    expect(mockAiUsageLogCount).not.toHaveBeenCalled();
  });

  it("blocks with 429 once the daily cap is reached", async () => {
    mockSettingsFindMany.mockResolvedValue(settings({}, { maxChatCalls: 5 }));
    mockAiUsageLogCount.mockResolvedValue(5);
    const res = await checkAiAccess("u1", "chat");
    expect(res.allowed).toBe(false);
    if (!res.allowed) {
      expect(res.status).toBe(429);
      expect(res.error).toMatch(/Daily AI limit reached/);
    }
  });

  it("allows while under the cap", async () => {
    mockSettingsFindMany.mockResolvedValue(settings({}, { maxChatCalls: 5 }));
    mockAiUsageLogCount.mockResolvedValue(4);
    await expect(checkAiAccess("u1", "chat")).resolves.toEqual({ allowed: true });
  });

  it("does not apply the chat cap to analyze", async () => {
    mockSettingsFindMany.mockResolvedValue(settings({}, { maxChatCalls: 1 }));
    mockAiUsageLogCount.mockResolvedValue(99);
    await expect(checkAiAccess("u1", "analyze")).resolves.toEqual({ allowed: true });
    expect(mockAiUsageLogCount).not.toHaveBeenCalled();
  });
});

describe("DEFAULT_FEATURE_FLAGS", () => {
  it("enables chatAssistant so existing installs are not silently blocked", () => {
    expect(DEFAULT_FEATURE_FLAGS.chatAssistant).toBe(true);
  });
});