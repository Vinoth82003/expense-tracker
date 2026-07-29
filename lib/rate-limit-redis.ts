import { NextResponse } from "next/server";

// SECURITY FIX: VULN-011 — Redis-backed rate limiter with in-memory fallback
// Uses ioredis when REDIS_URI is configured, otherwise falls back to in-memory Map

let redisClient: any = null;
try {
  if (process.env.REDIS_URI) {
    const Redis = require("ioredis");
    redisClient = new Redis(process.env.REDIS_URI, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });
  }
} catch {
  // Redis unavailable — fall back to in-memory
}

const inMemoryStore = new Map<string, { count: number; reset: number }>();

function getInMemoryEntry(key: string, windowMs: number) {
  const now = Date.now();
  const entry = inMemoryStore.get(key) ?? { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  return entry;
}

export function createRateLimiter(maxRequests: number, windowMs: number) {
  return async (identifier: string): Promise<NextResponse | null> => {
    if (redisClient) {
      try {
        const windowKey = Math.floor(Date.now() / windowMs).toString();
        const redisKey = `ratelimit:${identifier}:${windowKey}`;
        const current = await redisClient.incr(redisKey);
        if (current === 1) {
          await redisClient.pexpire(redisKey, windowMs);
        }
        if (current > maxRequests) {
          return NextResponse.json(
            { error: "Too many requests, please try again later." },
            { status: 429, headers: { "Retry-After": Math.ceil(windowMs / 1000).toString() } }
          );
        }
        return null;
      } catch {
        // Redis error — fall through to in-memory
      }
    }

    // In-memory fallback
    const entry = getInMemoryEntry(identifier, windowMs);
    entry.count++;
    inMemoryStore.set(identifier, entry);

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } }
      );
    }
    return null;
  };
}
