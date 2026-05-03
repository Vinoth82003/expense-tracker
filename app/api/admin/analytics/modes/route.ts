import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalUsers = await prisma.user.count();
    const limitMode = await prisma.user.count({ where: { expenseMode: "limit" } });
    const noLimitMode = totalUsers - limitMode;

    return NextResponse.json({
      limit: limitMode,
      noLimit: noLimitMode,
      total: totalUsers,
      limitPercent: totalUsers > 0 ? ((limitMode / totalUsers) * 100).toFixed(1) : 0,
      noLimitPercent: totalUsers > 0 ? ((noLimitMode / totalUsers) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error("Failed to fetch modes split:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
