import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch global notifications sent AFTER user was created
    const notifications = await (prisma as any).notification.findMany({
      where: {
        status: "SENT",
        createdAt: {
          gte: user.createdAt
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // Check last read timestamp to calculate unread count
    // If not tracked properly, just return recent. We'll add simple 'lastReadNotificationId' logic or assume all are unread if newer than last login.
    // Let's use a dummy unread count for MVP: notifications in last 7 days = unread
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const unreadCount = notifications.filter((n: any) => new Date(n.createdAt) > sevenDaysAgo).length;

    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Failed to fetch user notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
