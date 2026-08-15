import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

const { POST } = await import("../app/api/chat/telemetry/route");
const { logger } = await import("@/lib/logger");
const { getServerSession } = await import("next-auth");

beforeEach(() => {
  vi.resetAllMocks();
  // next-auth calls Next's headers() under the hood; in the vitest node
  // environment there is no request scope, so mock the session directly
  // (same pattern as tests/route.test.ts).
  (getServerSession as unknown as Mock).mockResolvedValue({
    user: { email: "user@example.com", id: "user-1" },
  });
});

describe("Chat telemetry route", () => {
  it("records telemetry events for valid payloads", async () => {
    const now = Date.now();
    const request = new Request("http://localhost/api/chat/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "chat.request",
        timestamp: now,
        payload: { success: true },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(logger.info).toHaveBeenCalledWith(
      "Chat telemetry event",
      expect.objectContaining({
        event: "chat.request",
        payload: { success: true },
      }),
      "API",
    );
  });

  it("returns 400 for invalid telemetry payloads", async () => {
    const request = new Request("http://localhost/api/chat/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: Date.now(),
        payload: { success: true },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid telemetry event" });
    expect(logger.info).not.toHaveBeenCalledWith(
      "Chat telemetry event",
      expect.anything(),
      "API",
    );
  });
});
