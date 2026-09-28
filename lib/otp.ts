import crypto from "crypto";

// SECURITY FIX: SEC-09 — OTPs were stored in plaintext. A 6-digit code has only
// 10^6 candidates, so an unsalted SHA-256 of it is reversible by brute force in
// seconds if the database is ever read. We store an HMAC-SHA256 instead, keyed
// with a server-side pepper, so a database leak alone does not reveal live codes.

const OTP_CONTEXT = "spendwise:otp:v1";

function getPepper(): string {
  // NEXTAUTH_SECRET is always present (the app refuses to start without it) and
  // is never exposed to the client, so it doubles as the pepper. Domain
  // separation keeps this digest from colliding with any other HMAC in the app.
  return process.env.NEXTAUTH_SECRET || process.env.INTERNAL_API_SECRET || "";
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(otp: string): string {
  const pepper = getPepper();
  if (!pepper) {
    throw new Error("OTP pepper is not configured; refusing to hash OTP");
  }
  return crypto
    .createHmac("sha256", pepper)
    .update(`${OTP_CONTEXT}:${otp}`)
    .digest("hex");
}

export function verifyOtp(candidate: string, storedHash: string | null): boolean {
  if (!storedHash) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(storedHash, "hex");
  } catch {
    return false;
  }

  // A stored value that is not a full-length HMAC is a legacy plaintext row.
  if (expected.length !== 32) return false;

  let actual: Buffer;
  try {
    actual = Buffer.from(hashOtp(candidate), "hex");
  } catch {
    return false;
  }

  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}
