import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSettings, mockUser, mockAuditLog, mockSystemLog, mockPageView } = vi.hoisted(() => ({
  mockSettings: { findUnique: vi.fn(), upsert: vi.fn() },
  mockUser: { findMany: vi.fn() },
  mockAuditLog: { findMany: vi.fn() },
  mockSystemLog: { findMany: vi.fn() },
  mockPageView: { deleteMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: mockSettings,
    user: mockUser,
    auditLog: mockAuditLog,
    systemLog: mockSystemLog,
    sitePageView: mockPageView,
    $runCommandRaw: vi.fn(),
  },
}));

const { mockSendReport } = vi.hoisted(() => ({
  mockSendReport: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendAdminMaintenanceReport: mockSendReport,
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET } from "@/app/api/cron/maintenance/route";
import { prisma } from "@/lib/prisma";

function request(auth?: string): Request {
  return new Request("http://localhost/api/cron/maintenance", {
    method: "GET",
    headers: auth ? { authorization: auth } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSettings.findUnique.mockResolvedValue(null);
  mockSettings.upsert.mockResolvedValue({});
  mockUser.findMany.mockResolvedValue([]);
  mockAuditLog.findMany.mockResolvedValue([]);
  mockSystemLog.findMany.mockResolvedValue([]);
  mockPageView.deleteMany.mockResolvedValue({ count: 0 });
  (prisma.$runCommandRaw as ReturnType<typeof vi.fn>).mockResolvedValue({ dataSize: 100 });
  mockSendReport.mockResolvedValue({ success: true });
  process.env.CRON_SECRET = "test-secret";
  delete process.env.DB_SIZE_LIMIT_MB;
});

describe("GET /api/cron/maintenance", () => {
  it("rejects requests without the CRON_SECRET bearer", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockSendReport).not.toHaveBeenCalled();
  });

  it("rejects requests with a wrong bearer token", async () => {
    const res = await GET(request("Bearer wrong"));
    expect(res.status).toBe(401);
    expect(mockSendReport).not.toHaveBeenCalled();
  });

  it("accepts the correct bearer token and reports an empty run", async () => {
    const res = await GET(request("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Nothing found => no emails, but the digest is marked sent.
    expect(mockSendReport).not.toHaveBeenCalled();
    expect(body.sent).toEqual([]);
  });

  it("sends the lifecycle digest when inactive users exist, then dedupes", async () => {
    mockUser.findMany
      .mockResolvedValueOnce([
        { email: "idle@example.com", name: "Idle", lastActive: new Date("2026-01-01") },
      ])
      .mockResolvedValue([]);

    const first = await GET(request("Bearer test-secret"));
    expect(first.status).toBe(200);
    expect(mockSendReport).toHaveBeenCalledTimes(1);
    expect(mockSendReport.mock.calls[0][0]).toContain("lifecycle");
    // lastSent was persisted so the next run dedupes.
    expect(mockSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "maintenance:lifecycle:lastSent" } })
    );

    // Simulate the dedupe marker being present.
    mockSettings.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === "maintenance:lifecycle:lastSent") {
        return Promise.resolve({ value: new Date().toISOString() });
      }
      return Promise.resolve(null);
    });

    const second = await GET(request("Bearer test-secret"));
    expect(second.status).toBe(200);
    expect(mockSendReport).toHaveBeenCalledTimes(1);
  });

  it("alerts on an API error spike at >= 5 errors/hour and dedupes hourly", async () => {
    const fiveErrors = Array.from({ length: 5 }, (_, i) => ({
      message: `GET /api/thing failed (${i})`,
      createdAt: new Date(),
    }));
    // Run 1: spike present.
    mockSystemLog.findMany.mockResolvedValueOnce(fiveErrors);

    const first = await GET(request("Bearer test-secret"));
    expect(first.status).toBe(200);
    expect(mockSendReport).toHaveBeenCalledTimes(1);
    expect(mockSendReport.mock.calls[0][0]).toContain("API error spike");

    // Run 2: spike still present but the hourly dedupe key was written.
    mockSettings.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === "maintenance:apiFailures:lastSent") {
        return Promise.resolve({ value: new Date().toISOString() });
      }
      return Promise.resolve(null);
    });
    mockSystemLog.findMany.mockResolvedValue(fiveErrors);

    const second = await GET(request("Bearer test-secret"));
    expect(second.status).toBe(200);
    expect(mockSendReport).toHaveBeenCalledTimes(1);
  });

  it("does not alert below the 5-errors/hour threshold", async () => {
    mockSystemLog.findMany.mockResolvedValue([
      { message: "boom", createdAt: new Date() },
      { message: "boom", createdAt: new Date() },
      { message: "boom", createdAt: new Date() },
      { message: "boom", createdAt: new Date() },
    ]);

    const res = await GET(request("Bearer test-secret"));
    expect(res.status).toBe(200);
    const reports = mockSendReport.mock.calls.map((c) => c[0]);
    expect(reports.some((s: string) => s.includes("API error spike"))).toBe(false);
  });

  it("alerts at the 50% and 75% DB size thresholds using DB_SIZE_LIMIT_MB", async () => {
    process.env.DB_SIZE_LIMIT_MB = "200"; // 100MB used => 50%
    (prisma.$runCommandRaw as ReturnType<typeof vi.fn>).mockResolvedValue({ dataSize: 100 });

    const res = await GET(request("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(mockSendReport).toHaveBeenCalledTimes(1);
    expect(mockSendReport.mock.calls[0][0]).toContain("50%");

    mockSendReport.mockClear();
    mockSettings.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === "maintenance:dbSize:lastSent:50") {
        return Promise.resolve({ value: new Date().toISOString() });
      }
      return Promise.resolve(null);
    });
    (prisma.$runCommandRaw as ReturnType<typeof vi.fn>).mockResolvedValue({ dataSize: 160 }); // 80% => 75% level

    await GET(request("Bearer test-secret"));
    expect(mockSendReport).toHaveBeenCalledTimes(1);
    expect(mockSendReport.mock.calls[0][0]).toContain("75%");
  });

  it("prunes site pageviews older than the retention window", async () => {
    mockPageView.deleteMany.mockResolvedValue({ count: 12 });

    const res = await GET(request("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.prunedPageviews).toBe(12);
    expect(mockPageView.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
  });
});
