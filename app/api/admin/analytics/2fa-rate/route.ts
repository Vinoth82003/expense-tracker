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
    const twoFactorEnabled = await prisma.user.count({ where: { twoFactorEnabled: true } });
    const pwaInstalled = await (prisma as any).user.count({ where: { isPWAInstalled: true } });

    return NextResponse.json({
      twoFactor: {
        count: twoFactorEnabled,
        percent: totalUsers > 0 ? ((twoFactorEnabled / totalUsers) * 100).toFixed(1) : 0
      },
      pwa: {
        count: pwaInstalled,
        percent: totalUsers > 0 ? ((pwaInstalled / totalUsers) * 100).toFixed(1) : 0
      },
      total: totalUsers
    });
  } catch (error) {
    console.error("Failed to fetch rates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
