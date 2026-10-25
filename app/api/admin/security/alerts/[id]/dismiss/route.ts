import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { prismaErrorCode } from "@/lib/admin/errors";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized alert dismiss attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid alert id." }, { status: 400 });
  }

  try {
    const admin = await getAdminInfo();

    const updated = await prisma.securityAlert.update({
      where: { id },
      data: {
        status: "DISMISSED",
        resolvedAt: new Date(),
        resolvedBy: admin?.adminName || "Admin",
      },
      include: { user: { select: { email: true } } },
    });

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "SECURITY_ALERT_DISMISSED",
      target: updated.user?.email || updated.id,
      details: `Dismissed ${updated.severity} security alert "${updated.type}": ${updated.description}`,
      ip,
    });

    return NextResponse.json({ message: "Alert dismissed", id: updated.id });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Alert not found." }, { status: 404 });
    }
    console.error("Failed to dismiss alert:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
