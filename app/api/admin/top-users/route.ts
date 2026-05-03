import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const topUsers = await prisma.user.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            expenses: true,
            reports: true
          }
        }
      },
      orderBy: [
        { reports: { _count: 'desc' } },
        { expenses: { _count: 'desc' } }
      ]
    });

    const formattedUsers = topUsers.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      name: u.name || u.email,
      avatar: u.avatar,
      expenseCount: u._count.expenses,
      reportCount: u._count.reports,
      lastActive: u.lastActive
    }));

    return NextResponse.json(formattedUsers);

  } catch (error) {
    console.error("Top users error:", error);
    return NextResponse.json({ message: "Failed to fetch top users" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
