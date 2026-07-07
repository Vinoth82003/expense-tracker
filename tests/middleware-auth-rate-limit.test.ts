import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function requestFor(pathname: string, ip: string) {
  return new NextRequest(`http://localhost${pathname}`, {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("middleware auth rate limiting", () => {
  it("does not rate-limit NextAuth session polling as login attempts", async () => {
    const ip = "session-polling-test";

    for (let i = 0; i < 12; i++) {
      const response = await middleware(requestFor("/api/auth/session", ip));
      expect(response.status).not.toBe(429);
    }
  });

  it("rate-limits actual auth callback attempts with JSON", async () => {
    const ip = "auth-callback-test";

    for (let i = 0; i < 10; i++) {
      const response = await middleware(requestFor("/api/auth/callback/credentials", ip));
      expect(response.status).not.toBe(429);
    }

    const limited = await middleware(requestFor("/api/auth/callback/credentials", ip));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("content-type")).toContain("application/json");
    await expect(limited.json()).resolves.toEqual({
      error: "Too many login attempts. Please try again later.",
    });
  });
});
