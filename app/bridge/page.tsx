import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isAllowedOrigin,
  currentOriginFromHeaders,
} from "@/lib/origins";

export const dynamic = "force-dynamic";

// Cross-origin auth bridge — PRIMARY APP ORIGIN side.
//
// A sibling SpendWise deployment redirects its users here after sign-in
// (/bridge?to=https://<sibling-origin>). This page holds a fresh session
// cookie (top-level navigation, so SameSite rules are satisfied), mints a
// one-time 60-second ticket bound to the user, and 302s to
//   <target-origin>/auth/bridge?ticket=<token>
// where the sibling exchanges it for its own session cookie.

const TICKET_TTL_MS = 60 * 1000;

export default async function BridgePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const params = await searchParams;
  const h = await headers();
  const currentOrigin = currentOriginFromHeaders(
    h.get("host"),
    h.get("x-forwarded-proto")
  );

  let targetOrigin: string | null = null;
  if (params.to) {
    try {
      const parsed = new URL(params.to);
      if (
        isAllowedOrigin(parsed.origin) &&
        (!currentOrigin || parsed.origin !== currentOrigin)
      ) {
        targetOrigin = parsed.origin;
      }
    } catch {}
  }

  // Nothing to bridge (missing/invalid target or same-origin request):
  // fall back to the normal in-app destination.
  if (!targetOrigin) {
    redirect("/");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect(
      `/login?bridgeTo=${encodeURIComponent(targetOrigin)}`
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    redirect(`/login?bridgeTo=${encodeURIComponent(targetOrigin)}`);
  }

  // Opportunistic cleanup of expired tickets.
  await prisma.authTicket
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.authTicket.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + TICKET_TTL_MS),
    },
  });

  redirect(`${targetOrigin}/auth/bridge?ticket=${token}`);
}
