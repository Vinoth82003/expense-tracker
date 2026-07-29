import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// SECURITY FIX: VULN-013 — Replaced new PrismaClient() with shared singleton

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const topUsers = await prisma.user.findMany({
      take: 5,
      where: {
        AND: [
          {
            isAdmin: false,
          },
          {
            NOT: {
              OR: [
                { name: { contains: "test", mode: "insensitive" } },
                { email: { contains: "test", mode: "insensitive" } },
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        lastActive: true,
        _count: {
          select: {
            expenses: true,
            reports: true,
          },
        },
      },
      orderBy: [
        { reports: { _count: "desc" } },
        { expenses: { _count: "desc" } },
      ],
    });

    if (topUsers.length === 0) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    // console.log("topUsers:", topUsers);

    const formattedUsers = topUsers.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      name: u.name || u.email,
      avatar: u.avatar,
      expenseCount: u._count.expenses,
      reportCount: u._count.reports,
      lastActive: u.lastActive,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Top users error:", error);
    return NextResponse.json(
      { message: "Failed to fetch top users" },
      { status: 500 },
    );
  }
}
