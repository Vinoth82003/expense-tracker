import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const INTERNAL_USER_ID_HEADER = "x-internal-user-id";
const INTERNAL_API_SECRET_HEADER = "x-internal-api-secret";

function getInternalApiSecret() {
  return process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET || "";
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

  if (secret !== expected) {
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
  const userId = (session?.user as any)?.id as string | undefined;
  return userId || null;
}
