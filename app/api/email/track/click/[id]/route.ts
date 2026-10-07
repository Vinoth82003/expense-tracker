import { NextRequest, NextResponse } from "next/server";
import { isFirstPartyUrl, markEmailClicked } from "@/lib/email-tracking";
import { appUrl } from "@/lib/site-url";

/**
 * Click-through redirect for tracked campaign links.
 *
 * `u` is the original absolute URL, written into the email by
 * injectEmailTracking(). Only first-party targets are honoured — anything else
 * (someone hand-crafting /click/<id>?u=https://evil.example) falls back to the
 * app home page, so this endpoint can never be used as an open redirector.
 *
 * The click is recorded fire-and-forget: a slow DB must not delay the redirect
 * the recipient is waiting on.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const target = req.nextUrl.searchParams.get("u");
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  if (target && isFirstPartyUrl(target)) {
    void markEmailClicked(id, {
      userAgent: req.headers.get("user-agent"),
      ip,
    });
    return NextResponse.redirect(target, { status: 302 });
  }

  return NextResponse.redirect(appUrl("/"), { status: 302 });
}
