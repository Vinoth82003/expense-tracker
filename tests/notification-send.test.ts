import { describe, it, expect, vi, beforeEach } from "vitest";

// The route reads the stagger at module load; zero it so tests don't sleep.
vi.hoisted(() => {
  process.env.NOTIFICATION_SEND_STAGGER_MS = "0";
});

const { mockNotification, mockUnsubscribe, mockUser, mockEmailLog } = vi.hoisted(() => ({
  mockNotification: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  mockUnsubscribe: { findMany: vi.fn() },
  mockUser: { findMany: vi.fn() },
  mockEmailLog: { findFirst: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: mockNotification,
    unsubscribe: mockUnsubscribe,
    user: mockUser,
    emailLog: mockEmailLog,
  },
}));

vi.mock("@/lib/admin-auth", () => ({ verifyAdminSession: vi.fn() }));

vi.mock("@/lib/admin/audit", () => ({
  getAdminInfo: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { mockSendEmail } = vi.hoisted(() => ({ mockSendEmail: vi.fn() }));

// Keep replaceVariables/wrapLayout real-ish but dependency-free so the test can
// assert exactly what reaches the transport.
vi.mock("@/lib/mail", () => ({
  sendEmail: mockSendEmail,
  replaceVariables: (text: string, vars: Record<string, string>) =>
    text.replace(/\{(\w+)\}/g, (_m, key: string) =>
      key in vars ? vars[key] : `{${key}}`
    ),
  wrapLayout: (content: string) => `<html><body>${content}</body></html>`,
}));

const { mockCreateLog } = vi.hoisted(() => ({ mockCreateLog: vi.fn() }));

vi.mock("@/lib/email-tracking", () => ({
  createEmailLog: mockCreateLog,
  injectEmailTracking: (html: string, id: string | null) =>
    id ? `${html}<!--track:${id}-->` : html,
}));

import { POST } from "@/app/api/admin/notifications/send/route";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";

function request(body: unknown): Request {
  return new Request("http://localhost/api/admin/notifications/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const twoRecipients = [
  { id: "user1", name: "Alice", email: "alice@example.com" },
  { id: "user2", name: null, email: "bob@example.com" },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyAdminSession).mockResolvedValue(true);
  vi.mocked(getAdminInfo).mockResolvedValue({
    adminId: "admin1",
    adminName: "Admin",
  } as Awaited<ReturnType<typeof getAdminInfo>>);
  vi.mocked(logAudit).mockResolvedValue(undefined);
  mockUnsubscribe.findMany.mockResolvedValue([]);
  mockUser.findMany.mockResolvedValue(twoRecipients);
  mockNotification.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: "notif1", ...data })
  );
  mockNotification.update.mockResolvedValue({});
  mockCreateLog.mockResolvedValue("log1");
  mockSendEmail.mockResolvedValue({ success: true });
});

describe("POST /api/admin/notifications/send (inline delivery)", () => {
  it("rejects unauthenticated requests", async () => {
    vi.mocked(verifyAdminSession).mockResolvedValue(false);
    const res = await POST(request({ subject: "s", body: "b" }) as never);
    expect(res.status).toBe(401);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("rejects a request missing subject or body", async () => {
    const res = await POST(request({ subject: "", body: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects when no recipients match", async () => {
    mockUser.findMany.mockResolvedValue([]);
    const res = await POST(request({ subject: "s", body: "b" }) as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/no recipients/i);
  });

  it("sends in text mode, converting newlines to <br/> and tracking each recipient", async () => {
    const res = await POST(
      request({ subject: "Hi {userName}", body: "Hello {userName}\nLine two", bodyFormat: "text" }) as never
    );
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe("SUCCESS");
    expect(data.delivered).toBe(2);
    expect(data.failed).toBe(0);

    // Campaign row persisted with the format.
    expect(mockNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ bodyFormat: "text" }) })
    );

    // One tracking row per recipient, keyed to the campaign.
    expect(mockCreateLog).toHaveBeenCalledTimes(2);

    const firstHtml = mockSendEmail.mock.calls[0][2] as string;
    const firstSubject = mockSendEmail.mock.calls[0][1] as string;
    expect(firstSubject).toBe("Hi Alice");
    expect(firstHtml).toContain("Hello Alice<br/>Line two");
    expect(firstHtml).toContain("<!--track:log1-->");

    // The final tally is written once.
    expect(mockNotification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SUCCESS" }),
      })
    );
    expect(vi.mocked(logAudit)).toHaveBeenCalledTimes(1);
  });

  it("sends raw HTML in html mode without injecting <br/>", async () => {
    const res = await POST(
      request({
        subject: "Embedded",
        body: "<h1>Hello {userName}</h1>\n<p>Raw</p>",
        bodyFormat: "html",
      }) as never
    );
    expect(res.status).toBe(200);

    expect(mockNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ bodyFormat: "html" }) })
    );

    const html = mockSendEmail.mock.calls[0][2] as string;
    expect(html).toContain("<h1>Hello Alice</h1>\n<p>Raw</p>");
    expect(html).not.toContain("<br/>");
  });

  it("reports PARTIAL and returns 200 when some sends fail", async () => {
    mockSendEmail
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: "smtp timeout" });

    const res = await POST(request({ subject: "s", body: "b" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("PARTIAL");
    expect(data.delivered).toBe(1);
    expect(data.failed).toBe(1);
    expect(mockNotification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PARTIAL" }),
      })
    );
  });

  it("returns 500 when every send fails", async () => {
    mockSendEmail.mockResolvedValue({ success: false, error: "smtp timeout" });

    const res = await POST(request({ subject: "s", body: "b" }) as never);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/all 2 email/i);
    expect(mockNotification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );
  });
});
