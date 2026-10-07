import { appUrl, resolveAppOrigin, resolveSiteOrigin } from "./site-url";
import { logger } from "./logger";

/**
 * EMAIL OPEN / CLICK TRACKING
 *
 * Every campaign send (mass notification via lib/queue.ts, feedback request via
 * /api/admin/reviews/request-feedback) gets one EmailLog row keyed to the
 * Notification that defines the campaign. The row's id is embedded in the
 * email as an open pixel and as rewritten link targets; the public
 * /api/email/track/* endpoints flip it to opened/clicked.
 *
 * All helpers here are non-throwing by contract: tracking must never be able to
 * fail or delay a delivery (same rule as logAsync in lib/mail.ts).
 */

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

type CreateEmailLogInput = {
  /** Notification.id of the campaign this send belongs to. */
  campaignId?: string | null;
  userId?: string | null;
  email: string;
};

/**
 * Creates (or reuses) the per-recipient tracking row.
 *
 * Reuse matters on queue retries: the same job re-attempted after an SMTP
 * failure must not produce a second EmailLog for the same campaign+recipient,
 * or the open counts double. Concurrency is 1 (see WORKER_CONCURRENCY), so a
 * find-then-create is safe here.
 *
 * Returns the log id, or null when tracking is unavailable (bad ObjectId,
 * DB down) — callers then send the plain, untracked email.
 */
export async function createEmailLog(input: CreateEmailLogInput): Promise<string | null> {
  try {
    if (!input.email) return null;
    const campaignId =
      input.campaignId && OBJECT_ID_RE.test(input.campaignId) ? input.campaignId : null;
    const userId = input.userId && OBJECT_ID_RE.test(input.userId) ? input.userId : null;

    const { prisma } = await import("./prisma");

    if (campaignId) {
      const existing = await prisma.emailLog.findFirst({
        where: { campaignId, email: input.email },
        select: { id: true },
      });
      if (existing) return existing.id;
    }

    const log = await prisma.emailLog.create({
      data: {
        ...(campaignId ? { campaignId } : {}),
        ...(userId ? { userId } : {}),
        email: input.email,
      },
      select: { id: true },
    });
    return log.id as string;
  } catch (error) {    void logger.warn("Failed to create email tracking log", { error: error instanceof Error ? error.message : String(error) }, "MAIL");
    return null;
  }
}

/**
 * Rewrites a wrapped email body for tracking:
 *  - appends a 1×1 open pixel pointing at /api/email/track/open/<id>
 *  - routes every first-party absolute link through /api/email/track/click/<id>
 *
 * Only first-party links (app + marketing origins) are rewritten — external
 * links (none today, but group invites could be) stay as they are, and an
 * attacker-crafted body can never turn the click endpoint into an open
 * redirector for arbitrary URLs.
 */
export function injectEmailTracking(html: string, logId: string | null): string {
  if (!logId || !OBJECT_ID_RE.test(logId)) return html;

  const pixelUrl = appUrl(`/api/email/track/open/${logId}.gif`);
  const withPixel = html.includes("</body>")
    ? html.replace("</body>", `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" /></body>`)
    : html + `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`;

  const appOrigin = resolveAppOrigin();
  const siteOrigin = resolveSiteOrigin();

  return withPixel.replace(/href="(https?:\/\/[^"]+)"/g, (match, url: string) => {
    try {
      const origin = new URL(url).origin;
      if (origin !== appOrigin && origin !== siteOrigin) return match;
      const tracked = appUrl(
        `/api/email/track/click/${logId}?u=${encodeURIComponent(url)}`
      );
      return `href="${tracked}"`;
    } catch {
      return match;
    }
  });
}

/** True when `url` points at one of our own origins (safe redirect target). */
export function isFirstPartyUrl(url: string): boolean {
  try {
    const origin = new URL(url).origin;
    return origin === resolveAppOrigin() || origin === resolveSiteOrigin();
  } catch {
    return false;
  }
}

/**
 * Marks a log as opened. Idempotent — the first open wins (openedAt is the
 * earliest observed open), later pixel fetches (re-fetches, prefetchers) only
 * update the capture metadata at most, never the timestamp.
 */
export async function markEmailOpened(
  logId: string,
  meta: { userAgent?: string | null; ip?: string | null }
): Promise<boolean> {
  try {
    if (!OBJECT_ID_RE.test(logId)) return false;
    const { prisma } = await import("./prisma");
    const existing = await prisma.emailLog.findUnique({
      where: { id: logId },
      select: { opened: true },
    });
    if (!existing) return false;
    if (existing.opened) return true;

    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        opened: true,
        openedAt: new Date(),
        userAgent: meta.userAgent?.slice(0, 500) ?? null,
        ip: meta.ip?.slice(0, 64) ?? null,
      },
    });
    return true;
  } catch (error) {    void logger.warn("Failed to mark email opened", { error: error instanceof Error ? error.message : String(error) }, "MAIL");
    return false;
  }
}

/** Marks a log as clicked. Same idempotency contract as markEmailOpened. */
export async function markEmailClicked(
  logId: string,
  meta: { userAgent?: string | null; ip?: string | null }
): Promise<boolean> {
  try {
    if (!OBJECT_ID_RE.test(logId)) return false;
    const { prisma } = await import("./prisma");
    const existing = await prisma.emailLog.findUnique({
      where: { id: logId },
      select: { clicked: true },
    });
    if (!existing) return false;
    if (existing.clicked) return true;

    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        clicked: true,
        clickedAt: new Date(),
        userAgent: meta.userAgent?.slice(0, 500) ?? null,
        ip: meta.ip?.slice(0, 64) ?? null,
      },
    });
    return true;
  } catch (error) {    void logger.warn("Failed to mark email clicked", { error: error instanceof Error ? error.message : String(error) }, "MAIL");
    return false;
  }
}
