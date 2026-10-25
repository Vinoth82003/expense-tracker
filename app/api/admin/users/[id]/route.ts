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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    // Explicit select — never expose password, 2FA secrets, or session tokens.
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        authProvider: true,
        monthlyLimit: true,
        expenseMode: true,
        onboarded: true,
        isAdmin: true,
        adminRole: true,
        isSuspended: true,
        suspensionReason: true,
        twoFactorEnabled: true,
        isLocked: true,
        lockedAt: true,
        lockReason: true,
        streak: true,
        lastActive: true,
        createdAt: true,
        _count: {
          select: {
            expenses: true,
            incomes: true,
            reports: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Aggregates for totals
    const [expenseSum, incomeSum, budgetHistory] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId: id },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { userId: id },
        _sum: { amount: true },
      }),
      prisma.budget.findMany({
        where: { userId: id },
        take: 6,
        orderBy: { month: "desc" },
      }),
    ]);

    return NextResponse.json({
      ...user,
      stats: {
        expenseTotal: expenseSum._sum.amount || 0,
        incomeTotal: incomeSum._sum.amount || 0,
        budgetHistory,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch user details", { error, userId: id });
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized user delete attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const admin = await getAdminInfo();
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    logger.error("Failed to delete user", { error, userId: id });
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
