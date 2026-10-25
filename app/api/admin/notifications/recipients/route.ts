import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  resolveAudience,
  type RecipientFilter,
} from "@/lib/admin/notification-recipients";

/**
 * Exact recipient audience preview for the notification composer.
 *
 * Accepts the same filter object the send endpoint accepts and returns the
 * number of deliverable recipients (matched users with an email, minus
 * unsubscribes) so the UI never has to estimate.
 */
export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const filter: RecipientFilter = body?.recipientFilter ?? {};
    const audience = await resolveAudience(filter);
    return NextResponse.json(audience);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
