import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth";

// Cross-origin auth bridge — SIBLING ORIGIN side.
//
// Receives ?ticket=<token> minted by the primary app origin's /bridge page,
// claims it exactly once against the shared database, mints this origin's own
// next-auth JWT session cookie (same NEXTAUTH_SECRET), and continues into the
// app. The user never sees credentials in a URL that outlives the request.

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, matches NextAuth default

export async function GET(req: NextRequest) {
  const ticket = req.nextUrl.searchParams.get("ticket");

  if (!ticket || typeof process.env.NEXTAUTH_SECRET !== "string") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const now = new Date();

  // Atomic single-use claim: only an unused, unexpired ticket can be claimed.
  const claimed = await prisma.authTicket.updateMany({
    where: { token: ticket, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });

  if (claimed.count === 0) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const record = await prisma.authTicket.findUnique({
    where: { token: ticket },
    include: { user: true },
  });

  // Housekeeping: consumed tickets are worthless, drop them.
  await prisma.authTicket
    .deleteMany({ where: { token: ticket } })
    .catch(() => {});

  if (!record?.user || record.user.isSuspended) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const jwt = await encode({
    token: {
      sub: record.user.id,
      name: record.user.name ?? "",
      email: record.user.email,
      picture: record.user.avatar ?? undefined,
    },
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: SESSION_MAX_AGE,
  });

  const destination = record.user.onboarded ? "/dashboard" : "/onboarding";
  const res = NextResponse.redirect(new URL(destination, req.url));
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: jwt,
    ...sessionCookieOptions(SESSION_MAX_AGE),
  });
  return res;
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
