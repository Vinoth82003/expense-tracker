import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// First-party, cookie-free pageview beacon for the public marketing site.
// Deliberately anonymous: no userId, no IP, no user-agent — only path,
// referrer, CDN country hint, and a per-tab random session id the client
// keeps in sessionStorage. Never throws; a failed write must not surface
// to visitors or break the page.

const MAX_PATH_LENGTH = 300;
const MAX_REFERRER_LENGTH = 500;

// Bot UAs we skip so crawler recrawls don't pollute the traffic numbers.
const BOT_PATTERN =
  /\b(bot|crawler|spider|crawling|slurp|headless|lighthouse|pagespeed|pingdom|uptimerobot|monitor|preview|facebookexternalhit|whatsapp|telegram|discord|embed|fetch)\b/i;

// Per-IP, per-minute cap so a scrape loop can't flood the collection.
const RATE_LIMIT = { max: 30, windowMs: 60_000 };
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    if (rateBuckets.size > 5000) {
      // Drop expired entries so the map can't grow unbounded.
      for (const [key, value] of rateBuckets) {
        if (now > value.resetAt) rateBuckets.delete(key);
      }
    }
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT.max;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ ok: true }, { status: 429 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    if (BOT_PATTERN.test(userAgent)) {
      return NextResponse.json({ ok: true });
    }

    const body = await req.json().catch(() => null);
    const rawPath = typeof body?.path === "string" ? body.path : "";
    const rawReferrer = typeof body?.referrer === "string" ? body.referrer : "";
    const rawSession = typeof body?.sessionId === "string" ? body.sessionId : "";

    // Only record same-site paths. An absolute external URL in `path` would
    // let anyone write arbitrary strings into the collection.
    const path = rawPath.startsWith("/") ? rawPath.slice(0, MAX_PATH_LENGTH) : "";
    if (!path) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const referrer = rawReferrer ? rawReferrer.slice(0, MAX_REFERRER_LENGTH) : null;
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      null;
    const sessionId = rawSession ? rawSession.slice(0, 64) : null;

    await prisma.sitePageView.create({
      data: { path, referrer, country, sessionId },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics must never error visibly — swallow and move on.
    return NextResponse.json({ ok: true });
  }
}
