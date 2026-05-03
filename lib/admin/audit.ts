import { prisma } from "@/lib/prisma";

export async function logAudit({
  adminName,
  adminId,
  actionType,
  target,
  details,
  ip
}: {
  adminName: string;
  adminId: string;
  actionType: string;
  target: string;
  details: string;
  ip: string;
}) {
  try {
    return await (prisma as any).auditLog.create({
      data: {
        adminName,
        adminId,
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
