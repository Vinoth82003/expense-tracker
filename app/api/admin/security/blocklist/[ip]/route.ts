import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { normalizeIpOrCidr } from "@/lib/admin/security-validation";
import { prismaErrorCode } from "@/lib/admin/errors";

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ip: string }> }
) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized unblock attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Next decodes the path segment for us, but the value may legitimately be a
  // CIDR (e.g. "203.0.113.0/24"), so validate before touching the DB.
  const { ip: rawTarget } = await params;
  const parsed = normalizeIpOrCidr(decodeURIComponent(rawTarget));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const target = parsed.value!;

  try {
    const admin = await getAdminInfo();

    const removed = await prisma.blockedIP.delete({ where: { ip: target } });

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "IP_UNBLOCKED",
      target,
      details: `Unblocked ${target}.`,
      ip,
    });

    return NextResponse.json({ message: "IP unblocked successfully", removed: removed.ip });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "That IP is not blocked." }, { status: 404 });
    }
    console.error("Failed to unblock IP:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
