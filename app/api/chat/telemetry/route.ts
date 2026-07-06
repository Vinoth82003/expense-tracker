import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
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
