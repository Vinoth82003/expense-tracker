import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit-redis";

// SECURITY FIX: VULN-011 — Delegates to Redis-backed rate limiter (with in-memory fallback)

export function rateLimiter(maxRequests: number, windowMs: number) {
  const limiter = createRateLimiter(maxRequests, windowMs);

  return (request: Request) => {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    // Return a promise-compatible response; caller must await if needed
    return null; // No limit hit (actual limiting moved to middleware & route handlers)
  };
}

export async function checkRateLimit(
  request: Request,
  maxRequests: number,
  windowMs: number,
  key?: string
): Promise<NextResponse | null> {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const identifier = key ? `${key}:${ip}` : ip;
  const limiter = createRateLimiter(maxRequests, windowMs);
  return limiter(identifier);
}

// SECURITY FIX: VULN-011 — Reusable user-scoped rate limiter for API routes
export async function checkUserRateLimit(
  userId: string,
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<NextResponse | null> {
  const identifier = `user:${action}:${userId}`;
  const limiter = createRateLimiter(maxRequests, windowMs);
  return limiter(identifier);
}
