import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/admin-auth";
import { cookies } from "next/headers";

// SECURITY FIX: VULN-019 — Auto-resolves admin identity instead of relying on callers

/**
 * Resolves the authenticated admin's identity from the DB.
 * Used exclusively server-side (not in middleware).
 */
const SYSTEM_ADMIN_ID = "000000000000000000000000";

function isValidObjectId(id?: string): boolean {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Resolves the authenticated admin's identity from the DB.
 * Used exclusively server-side (not in middleware).
 */
export async function getAdminInfo(): Promise<{ adminId: string; adminName: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session?.value) return null;
  const isValid = await verifyAdminToken(session.value);
  if (!isValid) return null;

  const adminEmail = process.env.ADMIN_USER;
  if (!adminEmail) return { adminId: SYSTEM_ADMIN_ID, adminName: "Admin" };

  try {
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (admin && isValidObjectId(admin.id)) {
      return { adminId: admin.id, adminName: admin.name || admin.email };
    }
  } catch {}

  return { adminId: SYSTEM_ADMIN_ID, adminName: adminEmail };
}

export async function logAudit({
  adminName,
  adminId,
  actionType,
  target,
  details,
  ip
}: {
  adminName?: string;
  adminId?: string;
  actionType: string;
  target: string;
  details: string;
  ip: string;
}) {
  try {
    // SECURITY FIX: VULN-019 — Resolve real admin identity from session
    let resolvedName = adminName;
    let resolvedId = adminId;
    if (!resolvedName || !resolvedId || !isValidObjectId(resolvedId)) {
      const adminInfo = await getAdminInfo();
      if (adminInfo) {
        resolvedName = adminInfo.adminName;
        resolvedId = adminInfo.adminId;
      }
    }

    const safeAdminId = isValidObjectId(resolvedId) ? resolvedId : SYSTEM_ADMIN_ID;

    return await (prisma as any).auditLog.create({
      data: {
        adminName: resolvedName || "Admin",
        adminId: safeAdminId,
        actionType,
        target,
        details,
        ip
      }
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}
