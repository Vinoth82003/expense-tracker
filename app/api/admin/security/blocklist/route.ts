import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  normalizeIpOrCidr,
  parseBlockExpiry,
  validateReason,
  isIpInRange,
} from "@/lib/admin/security-validation";

/** Best-effort client IP (first hop of x-forwarded-for). */
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const blocklist = await prisma.blockedIP.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ip: true,
        note: true,
        addedBy: true,
        requests: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    const now = Date.now();
    const withState = blocklist.map((entry) => ({
      ...entry,
      expired: entry.expiresAt ? entry.expiresAt.getTime() <= now : false,
    }));

    return NextResponse.json(withState);
  } catch (error) {
    console.error("Failed to fetch blocklist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized blocklist mutation attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const parsedIp = normalizeIpOrCidr(body.ip);
    if (!parsedIp.ok) {
      return NextResponse.json({ error: parsedIp.error }, { status: 400 });
    }
    const value = parsedIp.value!;

    const parsedReason = validateReason(body.note ?? body.reason, { min: 3 });
    if (!parsedReason.ok) {
      return NextResponse.json({ error: parsedReason.error }, { status: 400 });
    }

    const parsedExpiry = parseBlockExpiry(body.expiresAt ?? body.duration);
    if (!parsedExpiry.ok) {
      return NextResponse.json({ error: parsedExpiry.error }, { status: 400 });
    }

    // Self-lockout guard: never block a range that contains the acting admin.
    if (isIpInRange(ip, value)) {
      return NextResponse.json(
        { error: "Refusing to block the IP you are connecting from." },
        { status: 400 }
      );
    }

    const admin = await getAdminInfo();
    const adminName = admin?.adminName || "Admin";

    const blocked = await prisma.blockedIP.upsert({
      where: { ip: value },
      update: {
        note: parsedReason.value,
        addedBy: adminName,
        expiresAt: parsedExpiry.value,
      },
      create: {
        ip: value,
        note: parsedReason.value,
        addedBy: adminName,
        expiresAt: parsedExpiry.value,
      },
    });

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "IP_BLOCKED",
      target: value,
      details: `Blocked ${value}${parsedExpiry.value ? ` until ${parsedExpiry.value.toISOString()}` : " (no expiry)"}. Reason: ${parsedReason.value}`,
      ip,
    });

    return NextResponse.json(blocked);
  } catch (error) {
    console.error("Failed to block IP:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
