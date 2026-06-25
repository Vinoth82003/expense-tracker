import { cookies } from "next/headers";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";

const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Signs a session nonce using HMAC-SHA256 with ADMIN_JWT_SECRET.
 * Returns the combined token string: `<nonce>.<signature>`
 */
export async function signAdminSession(nonce: string): Promise<string> {
  if (!ADMIN_JWT_SECRET) {
    throw new Error("ADMIN_JWT_SECRET is not configured.");
  }
  const keyData = encoder.encode(ADMIN_JWT_SECRET);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(nonce)
  );
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const sig = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${nonce}.${sig}`;
}

/**
 * Verifies a signed admin session token from the cookie value.
 * Returns true only if the token is valid and the signature matches.
 */
export async function verifyAdminToken(tokenValue: string): Promise<boolean> {
  if (!ADMIN_JWT_SECRET || !tokenValue) return false;

  const dotIndex = tokenValue.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const nonce = tokenValue.slice(0, dotIndex);
  const providedSig = tokenValue.slice(dotIndex + 1);

  if (!nonce || !providedSig) return false;
  if (providedSig.length !== 64) return false;

  try {
    const keyData = encoder.encode(ADMIN_JWT_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const providedSigBytes = hexToBytes(providedSig);
    const dataBytes = encoder.encode(nonce);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      providedSigBytes as BufferSource,
      dataBytes as BufferSource
    );
  } catch (err) {
    console.error("verifyAdminToken error:", err);
    return false;
  }
}

/**
 * Server-side helper: reads the `admin_session` cookie and verifies the HMAC signature.
 * Use this in all API route handlers and server components.
 */
export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session?.value) return false;
  return await verifyAdminToken(session.value);
}
