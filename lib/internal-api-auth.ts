import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { evaluateEntitlement } from "@/lib/user-entitlement";

const INTERNAL_USER_ID_HEADER = "x-internal-user-id";
const INTERNAL_API_SECRET_HEADER = "x-internal-api-secret";

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// SECURITY FIX: SEC-04 — this must never fall back to NEXTAUTH_SECRET. That
// secret signs session JWTs, so reusing it here would let anyone who can read
// it impersonate any user id via the internal headers. Internal service calls
// need their own secret.
function getInternalApiSecret() {
  return process.env.INTERNAL_API_SECRET || "";
}

export function getInternalApiHeaders(userId: string) {
  return {
    [INTERNAL_USER_ID_HEADER]: userId,
    [INTERNAL_API_SECRET_HEADER]: getInternalApiSecret(),
  };
}

export function isTrustedInternalRequest(request: Request) {
  const userId = request.headers.get(INTERNAL_USER_ID_HEADER);
  const secret = request.headers.get(INTERNAL_API_SECRET_HEADER);
  const expected = getInternalApiSecret();

  if (!userId || !secret || !expected) {
    return null;
  }

  if (!timingSafeEqualString(secret, expected)) {
    return null;
  }

  return { userId };
}

export async function getAuthenticatedUserId(request: Request) {
  const internal = isTrustedInternalRequest(request);
  if (internal) {
    return internal.userId;
  }

  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (Session["user"] & {
        id?: string;
        isSuspended?: boolean;
        twoFactorEnabled?: boolean;
        twoFactorVerifiedAt?: Date | string | null;
      })
    | null
    | undefined;

  // SECURITY FIX: SEC-01 / SEC-02 — fail closed for suspended accounts and for
  // accounts that have not completed a 2FA challenge. Returning null makes every
  // existing caller treat the request as unauthenticated, so this closes the gap
  // for all routes at once without touching each handler.
  const decision = evaluateEntitlement({
    id: user?.id,
    isSuspended: user?.isSuspended,
    twoFactorEnabled: user?.twoFactorEnabled,
    twoFactorVerifiedAt: user?.twoFactorVerifiedAt,
  });

  if (decision.status !== "ok") {
    return null;
  }

  return decision.userId ?? null;
}
