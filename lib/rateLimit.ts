import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit-redis";

// SECURITY FIX: VULN-011 — Delegates to Redis-backed rate limiter (with in-memory fallback)

// SECURITY FIX: SEC-08 — the previous implementation computed an IP and then
// unconditionally returned null, so any caller relying on it had no rate
// limiting at all. It now delegates to the Redis-backed limiter like the others.
export function rateLimiter(maxRequests: number, windowMs: number) {
  const limiter = createRateLimiter(maxRequests, windowMs);

  return async (request: Request): Promise<NextResponse | null> => {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    return limiter(`ip:${ip}`);
  };
}

// SECURITY FIX: SEC-08 — for throttles that run before a session exists (the
// credentials `authorize` callback has no request and no user id), key the
// shared limiter on an arbitrary identifier such as a normalised email.
export async function checkIdentifierRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<NextResponse | null> {
  const limiter = createRateLimiter(maxRequests, windowMs);
  return limiter(`id:${action}:${identifier}`);
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
