import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { validateOrigin } from "@/lib/csrf";

// SECURITY FIX: VULN-009 — Added auth requirement for telemetry endpoint

export async function POST(request: Request) {
  try {
    // SECURITY FIX: VULN-009 — Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY FIX: VULN-020 — CSRF origin validation
    const csrfCheck = validateOrigin(request);
    if (csrfCheck) return csrfCheck;

    const body = await request.json().catch(() => ({}));
    const event = typeof body?.event === "string" ? body.event : null;
    const timestamp = body?.timestamp ? new Date(body.timestamp) : new Date();
    const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};

    if (!event) {
      return NextResponse.json({ error: "Invalid telemetry event" }, { status: 400 });
    }

    await logger.info(
      "Chat telemetry event",
      {
        event,
        timestamp: timestamp.toISOString(),
        payload,
      },
      "API"
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telemetry error:", err);
    return NextResponse.json({ error: "Telemetry error" }, { status: 500 });
  }
}
