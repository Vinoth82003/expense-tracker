import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const twoFA = searchParams.get("twoFA"); // "Enabled", "Disabled"
    const mode = searchParams.get("mode"); // "Limit", "No-limit"
    const joined = searchParams.get("joined"); // "Last 7d", "Last 30d"
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (twoFA === "Enabled") where.twoFactorEnabled = true;
    if (twoFA === "Disabled") where.twoFactorEnabled = false;

    if (mode === "Limit") where.expenseMode = "limit";
    if (mode === "No-limit") where.expenseMode = "no-limit";

    if (joined === "Last 7d") {
      where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (joined === "Last 30d") {
      where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

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
          ...({ isSuspended: true } as any),
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Stats for the strip
    const [totalUsers, activeToday, twoFAEnabled] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { lastActive: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      }),
      prisma.user.count({
        where: { twoFactorEnabled: true }
      })
    ]);

    return NextResponse.json({
      users,
      total,
      stats: { totalUsers, activeToday, twoFAEnabled }
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
