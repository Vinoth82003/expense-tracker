// SECURITY FIX: SEC-10 — security audit records (OTPLog, LoginHistory,
// UserSession) were written with hardcoded placeholder values, which makes the
// audit trail useless for exactly the incidents it exists to investigate.

function firstForwardedValue(header: string | null): string | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

export function getClientIp(headers: Headers): string {
  const candidates = [
    firstForwardedValue(headers.get("x-forwarded-for")),
    firstForwardedValue(headers.get("x-real-ip")),
    headers.get("cf-connecting-ip"),
    headers.get("true-client-ip"),
  ];

  for (const candidate of candidates) {
    if (candidate) return candidate.slice(0, 64);
  }

  return "unknown";
}

export function getUserAgent(headers: Headers): string | null {
  const ua = headers.get("user-agent");
  return ua ? ua.slice(0, 512) : null;
}

export function getRequestMeta(request: Request): {
  ip: string;
  userAgent: string | null;
} {
  return {
    ip: getClientIp(request.headers),
    userAgent: getUserAgent(request.headers),
  };
}

export function getClientIpFromHeaders(headers: Record<string, string | undefined>): string {
  return getClientIp(new Headers(compact(headers)));
}

export function getUserAgentFromHeaders(
  headers: Record<string, string | undefined>
): string | null {
  return getUserAgent(new Headers(compact(headers)));
}

function compact(headers: Record<string, string | undefined>): [string, string][] {
  return Object.entries(headers).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string"
  );
}

// next-auth callbacks do not receive the raw request. When running under
// next/headers these helpers resolve the ambient request headers, which gives
// the audit trail real values inside a server component / route handler.
export function requestMetaHeaders(): Record<string, string | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { headers } = require("next/headers") as typeof import("next/headers");
    const store = headers() as unknown as { get(name: string): string | null };
    if (!store || typeof store.get !== "function") return {};
    return {
      "x-forwarded-for": store.get("x-forwarded-for") ?? undefined,
      "x-real-ip": store.get("x-real-ip") ?? undefined,
      "cf-connecting-ip": store.get("cf-connecting-ip") ?? undefined,
      "true-client-ip": store.get("true-client-ip") ?? undefined,
      "user-agent": store.get("user-agent") ?? undefined,
    };
  } catch {
    return {};
  }
}
