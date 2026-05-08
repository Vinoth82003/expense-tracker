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
      select: { 
        id: true,
        createdAt: true, 
        name: true, 
        email: true,
        lastActive: true,
        expenseMode: true,
        onboarded: true,
        isPWAInstalled: true,
        twoFactorEnabled: true,
        readNotificationIds: true, 
        deletedNotificationIds: true,
        _count: {
          select: {
            expenses: true,
            incomes: true
          }
        }
      },
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

    const userName = user.name || "User";
    const now = new Date();

    const filteredNotifications = notifications.filter((n: any) => {
      // 1. Check if deleted
      if (user.deletedNotificationIds.includes(n.id)) return false;

      // 2. Apply recipient filters
      if (!n.recipientFilter) return true;
      
      try {
        const filter = JSON.parse(n.recipientFilter);
        if (Object.keys(filter).length === 0) return true;

        // Basic property checks
        if (filter.twoFactorEnabled && !user.twoFactorEnabled) return false;
        if (filter.limitMode && user.expenseMode !== "limit") return false;
        
        // Date checks (Targeting)
        if (filter.active30d) {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (!user.lastActive || user.lastActive < thirtyDaysAgo) return false;
        }

        if (filter.newUsers) {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (!user.createdAt || user.createdAt < sevenDaysAgo) return false;
        }

        // Inactivity filters
        if (filter.inactive2d) {
          const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          if (user.lastActive && user.lastActive > twoDaysAgo) return false;
        }

        if (filter.inactive7d) {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (user.lastActive && user.lastActive > sevenDaysAgo) return false;
        }

        if (filter.noPWA && user.isPWAInstalled) return false;
        if (filter.onboarded === false && user.onboarded) return false;

        if (filter.specificEmail && user.email !== filter.specificEmail) return false;

        // Relation-based filters
        if (filter.incomeNoExpenses) {
          if (user._count.incomes === 0 || user._count.expenses > 0) return false;
        }
        
        if (filter.noIncomeNoExpenses) {
          if (user._count.incomes > 0 || user._count.expenses > 0) return false;
        }
        
        return true;
      } catch (e) {
        return true; 
      }
    });

    const personalizedNotifications = filteredNotifications.map((n: any) => {
      const subject = typeof n.subject === "string" ? n.subject.replace(/{userName}/g, userName) : n.subject;
      const body = typeof n.body === "string" ? n.body.replace(/{userName}/g, userName) : n.body;

      return {
        ...n,
        subject,
        body,
        isRead: user.readNotificationIds.includes(n.id),
      };
    });

    const unreadCount = personalizedNotifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({
      notifications: personalizedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to fetch user notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
