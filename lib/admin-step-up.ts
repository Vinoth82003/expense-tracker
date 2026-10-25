import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

/**
 * Server-only "step-up" credential verification for sensitive admin mutations
 * (2FA override, lock/unlock, broadcast). Kept out of lib/admin-auth.ts because
 * that module is imported by edge middleware and must stay Web-Crypto only.
 *
 * Hardening over the previous per-route checks:
 *  - supports a bcrypt hash (`ADMIN_PASS_HASH` / `ADMIN_OVERRIDE_PASSWORD_HASH`)
 *    so the raw secret need not sit in plaintext env;
 *  - constant-time comparison for the plaintext fallback instead of `===`;
 *  - a shared failure rate-limiter so a compromised session cannot brute-force
 *    the step-up secret.
 */

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Perform a comparison anyway to keep timing roughly uniform.
    const len = Math.max(bufA.length, bufB.length, 1);
    timingSafeEqual(Buffer.alloc(len, 1), Buffer.alloc(len, 1));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function compareBcrypt(password: string, hash?: string): boolean | null {
  if (!hash) return null;
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

/** Verifies the primary admin password (`ADMIN_PASS_HASH` or `ADMIN_PASS`). */
export function verifyAdminPassword(password?: string | null): boolean {
  if (!password) return false;
  const hashResult = compareBcrypt(password, process.env.ADMIN_PASS_HASH);
  if (hashResult !== null) return hashResult;
  const plain = process.env.ADMIN_PASS;
  if (!plain) return false;
  return safeEqual(password, plain);
}

/**
 * Verifies the elevated override secret. Falls back to the primary admin
 * password so a single configured secret still gates step-up.
 */
export function verifyAdminOverridePassword(password?: string | null): boolean {
  if (!password) return false;
  const hashResult = compareBcrypt(password, process.env.ADMIN_OVERRIDE_PASSWORD_HASH);
  if (hashResult !== null) return hashResult;
  const plain = process.env.ADMIN_OVERRIDE_PASSWORD;
  if (plain) return safeEqual(password, plain);
  return verifyAdminPassword(password);
}

const STEP_UP_MAX_ATTEMPTS = Number(process.env.ADMIN_STEP_UP_MAX_ATTEMPTS || 5);
const STEP_UP_WINDOW_MS = Number(process.env.ADMIN_STEP_UP_WINDOW_MS || 15 * 60 * 1000);

const stepUpFailures = new Map<string, { count: number; first: number }>();

/** Returns true if this actor/IP has exhausted the step-up attempt budget. */
export function isStepUpRateLimited(key: string): boolean {
  const entry = stepUpFailures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > STEP_UP_WINDOW_MS) {
    stepUpFailures.delete(key);
    return false;
  }
  return entry.count >= STEP_UP_MAX_ATTEMPTS;
}

export function registerStepUpFailure(key: string): void {
  const now = Date.now();
  const entry = stepUpFailures.get(key);
  if (!entry || now - entry.first > STEP_UP_WINDOW_MS) {
    stepUpFailures.set(key, { count: 1, first: now });
  } else {
    entry.count += 1;
  }
}

export function clearStepUpFailures(key: string): void {
  stepUpFailures.delete(key);
}
