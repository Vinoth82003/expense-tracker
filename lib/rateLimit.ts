import { NextResponse } from "next/server";

// Simple in-memory rate limiter per IP address
// Limits requests to `maxRequests` per `windowMs` milliseconds.
// This is sufficient for low‑traffic APIs like contact or login.
export function rateLimiter(maxRequests: number, windowMs: number) {
  const ipMap = new Map<string, { count: number; reset: number }>();

  return (request: Request) => {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const entry = ipMap.get(ip) ?? { count: 0, reset: now + windowMs };

    if (now > entry.reset) {
      // Reset the window
      entry.count = 0;
      entry.reset = now + windowMs;
    }

    entry.count++;
    ipMap.set(ip, entry);

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.reset - now) / 1000);
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } }
      );
    }
    return null; // No limit hit
  };
}
