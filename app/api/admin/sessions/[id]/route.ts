import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Read-only: individual sessions cannot be revoked under JWT auth. Access is
// cut off by locking the account (Security -> Lockouts). See the collection
// route for the full rationale.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  try {
    const session = await prisma.userSession.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        device: true,
        browser: true,
        ip: true,
        location: true,
        expires: true,
        createdAt: true,
        user: { select: { name: true, email: true, avatar: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    logger.error("Failed to fetch session", { error, sessionId: id });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
