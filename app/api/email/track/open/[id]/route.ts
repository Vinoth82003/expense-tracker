import { NextRequest, NextResponse } from "next/server";
import { markEmailOpened } from "@/lib/email-tracking";

/**
 * 1×1 transparent GIF — the open pixel.
 *
 * Public by design (email clients fetch it with no cookies/headers we control),
 * so it does no auth. It never fails visibly: any error still returns the pixel,
 * because a broken tracker must not surface as a broken image in the inbox.
 * DB writes are idempotent (first open wins) so prefetchers that re-fetch the
 * pixel cannot inflate the count.
 */
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const headers = {
  "Content-Type": "image/gif",
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Route is /api/email/track/open/<id>.gif — strip the extension if present.
    const logId = id.replace(/\.gif$/i, "");
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    void markEmailOpened(logId, {
      userAgent: req.headers.get("user-agent"),
      ip,
    });
  } catch {
    /* tracking must never error the response */
  }

  return new NextResponse(PIXEL, { status: 200, headers });
}
