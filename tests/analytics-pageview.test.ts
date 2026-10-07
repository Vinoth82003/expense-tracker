import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sitePageView: { create: mockCreate },
  },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/analytics/pageview/route";

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/analytics/pageview", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({});
});

describe("POST /api/analytics/pageview", () => {
  it("records a valid first-party pageview with country hint", async () => {
    const res = await POST(
      makeRequest(
        { path: "/pricing", referrer: "https://www.google.com/", sessionId: "abc-123" },
        { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "x-vercel-ip-country": "IN" }
      )
    );

    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].data).toMatchObject({
      path: "/pricing",
      referrer: "https://www.google.com/",
      sessionId: "abc-123",
      country: "IN",
    });
  });

  it("rejects a missing or non-slash path", async () => {
    const res = await POST(
      makeRequest({ path: "https://evil.example.com" }, { "user-agent": "Mozilla/5.0" })
    );
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("drops non-string and absolute-URL paths", async () => {
    const res = await POST(makeRequest({ path: 42 }, { "user-agent": "Mozilla/5.0" }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("ignores known bot user-agents", async () => {
    const res = await POST(
      makeRequest({ path: "/", sessionId: "bot" }, { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" })
    );
    expect(res.status).toBe(200);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("still returns 200 when the database write fails", async () => {
    mockCreate.mockRejectedValue(new Error("mongo down"));
    const res = await POST(
      makeRequest({ path: "/docs", sessionId: "s" }, { "user-agent": "Mozilla/5.0" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("caps path length to 300 characters", async () => {
    const longPath = `/${"a".repeat(500)}`;
    await POST(makeRequest({ path: longPath }, { "user-agent": "Mozilla/5.0" }));
    expect(mockCreate.mock.calls[0][0].data.path.length).toBe(300);
  });
});
