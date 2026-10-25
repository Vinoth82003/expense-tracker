import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { prismaErrorCode } from "@/lib/admin/errors";
import { parseUserListQuery, buildUsersWhere } from "@/lib/admin/users-filter";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = parseUserListQuery(searchParams);
    const where = buildUsersWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          expenseMode: true,
          twoFactorEnabled: true,
          lastActive: true,
          createdAt: true,
          isSuspended: true,
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Stats strip is intentionally platform-wide (not filtered). Scope is
    // surfaced so the UI never implies the numbers track the active filter.
    const [totalUsers, activeToday, twoFAEnabled] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { lastActive: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
    ]);

    return NextResponse.json({
      users,
      total,
      page: query.page,
      limit: query.limit,
      statsScope: "all-users",
      stats: { totalUsers, activeToday, twoFAEnabled },
    });
  } catch (error) {
    logger.error("Failed to fetch users", { error });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized user delete attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !OBJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "A valid user id is required" }, { status: 400 });
    }

    const admin = await getAdminInfo();
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Self-delete guard — an admin must not delete their own account.
    if (admin?.adminId === target.id) {
      return NextResponse.json(
        { error: "Refusing to delete your own admin account." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "USER_DELETED",
      target: target.email,
      details: `Deleted user ${target.email}.`,
      ip,
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    logger.error("Failed to delete user", { error });
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
