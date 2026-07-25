import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Fetch global settings
    const settingsRows = await (prisma as any).settings.findMany({
      where: {
        key: {
          in: ["maintenance", "featureFlags"]
        }
      }
    });

    const settingsMap = settingsRows.reduce((acc: any, row: any) => {
      try {
        acc[row.key] = JSON.parse(row.value);
      } catch (e) {
        acc[row.key] = row.value;
      }
      return acc;
    }, {});

    const maintenance = settingsMap.maintenance || { enabled: false, message: "" };
    const featureFlags = settingsMap.featureFlags || {};

    let userStatus: { isSuspended: boolean; suspensionReason: string | null } = {
      isSuspended: false,
      suspensionReason: null
    };

    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).id) {
      const userId = (session.user as any).id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuspended: true, suspensionReason: true, isAdmin: true }
      });

      if (user) {
        userStatus.isSuspended = user.isSuspended;
        userStatus.suspensionReason = user.suspensionReason;

        // Admins might bypass maintenance
        if (maintenance.enabled && maintenance.adminBypass && user.isAdmin) {
          maintenance.enabled = false;
        }
      }
    }

    return NextResponse.json({
      maintenance,
      featureFlags,
      userStatus
    });
  } catch (error) {
    console.error("System status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
