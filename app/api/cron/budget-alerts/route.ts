import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBudgetAlertEmail } from "@/lib/mail";

export async function GET(req: Request) {
  // Simple auth for cron (in production, use a secure cron secret)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Get threshold setting
    const thresholdSetting = await prisma.settings.findUnique({
      where: { key: "budgetAlertThreshold" }
    });
    const threshold = thresholdSetting ? parseInt(thresholdSetting.value) : 80;

    // 2. Get current month
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 3. Find eligible users
    // Need users with expenseMode = "limit", a monthly limit, and who haven't been alerted this month.
    // We also need to exclude users who have unsubscribed.
    const unsubscribedUsers = await prisma.unsubscribe.findMany({ select: { email: true } });
    const unsubscribedEmails = unsubscribedUsers.map(u => u.email);

    const eligibleUsers = await (prisma.user as any).findMany({
      where: {
        expenseMode: "limit",
        monthlyLimit: { gt: 0 },
        email: { notIn: unsubscribedEmails },
        OR: [
          { lastBudgetAlertMonth: null },
          { lastBudgetAlertMonth: { not: currentMonthStr } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        monthlyLimit: true,
      }
    });

    let alertsSent = 0;

    // 4. Check expenses for each user
    for (const user of eligibleUsers) {
      if (!user.monthlyLimit) continue;

      const expenses = await prisma.expense.aggregate({
        where: {
          userId: user.id,
          date: { gte: firstDayOfMonth }
        },
        _sum: { amount: true }
      });

      const totalSpent = expenses._sum.amount || 0;
      const spentPercent = (totalSpent / user.monthlyLimit) * 100;

      if (spentPercent >= threshold) {
        // Send email
        const mailResult = await sendBudgetAlertEmail(
          user.email,
          user.name || "User",
          Math.round(spentPercent),
          totalSpent,
          user.monthlyLimit
        );

        if (mailResult.success) {
          // Update last alert month
          await (prisma.user as any).update({
            where: { id: user.id },
            data: { lastBudgetAlertMonth: currentMonthStr }
          });
          alertsSent++;
        }
      }
    }

    return NextResponse.json({ success: true, alertsSent });
  } catch (error) {
    console.error("Budget alerts cron failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
