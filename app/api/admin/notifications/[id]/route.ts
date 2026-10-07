import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const notification = await (prisma as any).notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Attempt to reconstruct recipients based on filter
    let recipients: { name: string | null, email: string }[] = [];
    
    try {
      const recipientFilter = notification.recipientFilter ? JSON.parse(notification.recipientFilter) : null;
      
      const unsubscribed = await (prisma as any).unsubscribe.findMany({
        select: { email: true }
      });
      const unsubscribedEmails = unsubscribed.map((u: any) => u.email);

      const where: any = {
        email: { notIn: unsubscribedEmails }
      };

      if (recipientFilter && Object.keys(recipientFilter).length > 0) {
        if (recipientFilter.twoFactorEnabled) where.twoFactorEnabled = true;
        if (recipientFilter.limitMode) where.expenseMode = "limit";
        if (recipientFilter.active30d) {
          where.lastActive = { gte: subDays(new Date(), 30) };
        }
        if (recipientFilter.newUsers) {
          where.createdAt = { gte: subDays(new Date(), 7) };
        }
        if (recipientFilter.noIncomeNoExpenses) {
          where.AND = [
            { incomes: { none: {} } },
            { expenses: { none: {} } }
          ];
        }
        if (recipientFilter.specificEmail) {
          where.email = recipientFilter.specificEmail;
        }
      }

      recipients = await prisma.user.findMany({
        where,
        select: { name: true, email: true }
      });
    } catch (e) {
      console.error("Failed to parse or reconstruct recipients", e);
    }

    // Per-recipient tracking: who actually opened/clicked this campaign.
    // Name is resolved from the User record (EmailLog stores only the address),
    // falling back to a blank name for addresses with no matching account.
    let engagement: {
      sent: number;
      opened: number;
      clicked: number;
      recipients: {
        email: string;
        name: string | null;
        opened: boolean;
        openedAt: string | null;
        clicked: boolean;
        clickedAt: string | null;
      }[];
    } | null = null;

    try {
      const logs = await (prisma as any).emailLog.findMany({
        where: { campaignId: id },
        orderBy: { sentAt: "asc" },
        select: {
          email: true,
          userId: true,
          opened: true,
          openedAt: true,
          clicked: true,
          clickedAt: true,
        },
      });

      if (logs.length > 0) {
        const userIds = [
          ...new Set(logs.map((l: any) => l.userId).filter(Boolean)),
        ] as string[];
        const users =
          userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true },
              })
            : [];
        const nameById = new Map(users.map((u: any) => [u.id, u.name]));

        engagement = {
          sent: logs.length,
          opened: logs.filter((l: any) => l.opened).length,
          clicked: logs.filter((l: any) => l.clicked).length,
          recipients: logs.map((l: any) => ({
            email: l.email,
            name: l.userId ? nameById.get(l.userId) ?? null : null,
            opened: l.opened,
            openedAt: l.openedAt?.toISOString?.() ?? null,
            clicked: l.clicked,
            clickedAt: l.clickedAt?.toISOString?.() ?? null,
          })),
        };
      }
    } catch (e) {
      console.error("Failed to load campaign engagement", e);
    }

    return NextResponse.json({ notification, recipients, engagement });
  } catch (error) {
    console.error("Failed to fetch notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
