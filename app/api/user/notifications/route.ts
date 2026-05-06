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
      select: { createdAt: true, name: true, readNotificationIds: true, deletedNotificationIds: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch global notifications sent AFTER user was created
    const notifications = await (prisma as any).notification.findMany({
      where: {
        status: "SUCCESS",
        createdAt: {
          gte: user.createdAt,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Filter out deleted notifications
    const activeNotifications = notifications.filter(
      (n: any) => !user.deletedNotificationIds.includes(n.id)
    );

    const userName = user.name || "User";
    const personalizedNotifications = activeNotifications.map((n: any) => {
      const subject =
        typeof n.subject === "string"
          ? n.subject.replace(/{userName}/g, userName)
          : n.subject;

      const body =
        typeof n.body === "string"
          ? n.body.replace(/{userName}/g, userName)
          : n.body;

      return {
        ...n,
        subject,
        body,
        isRead: user.readNotificationIds.includes(n.id),
      };
    });

    const unreadCount = personalizedNotifications.filter(
      (n: any) => !n.isRead
    ).length;

    return NextResponse.json({
      notifications: personalizedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to fetch user notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
