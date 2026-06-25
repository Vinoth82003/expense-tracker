import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";
import { subDays } from "date-fns";
import { logger } from "@/lib/logger";
import { sendFeedbackRequestEmail } from "@/lib/mail";


export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientFilter } = await req.json();
    
    await logger.info(`Starting bulk feedback request send`, { recipientFilter }, "API");

    // 1. Fetch unsubscribed emails
    const unsubscribed = await (prisma as any).unsubscribe.findMany({
      select: { email: true }
    });
    const unsubscribedEmails = unsubscribed.map((u: any) => u.email);

    // 2. Build where clause
    const where: any = {
      email: { notIn: unsubscribedEmails }
    };

    if (recipientFilter) {
      const { 
        twoFactorEnabled, limitMode, active30d, newUsers, 
        incomeNoExpenses, noIncomeNoExpenses,
        inactive2d, inactive7d, specificEmail 
      } = recipientFilter;

      if (twoFactorEnabled) where.twoFactorEnabled = true;
      if (limitMode) where.expenseMode = "limit";
      if (active30d) where.lastActive = { gte: subDays(new Date(), 30) };
      if (newUsers) where.createdAt = { gte: subDays(new Date(), 7) };
      
      if (incomeNoExpenses) {
        where.incomes = { some: {} };
        where.expenses = { none: {} };
      }
      
      if (noIncomeNoExpenses) {
        where.incomes = { none: {} };
        where.expenses = { none: {} };
      }

      if (inactive2d) {
        where.lastActive = { lte: subDays(new Date(), 2) };
      }

      if (inactive7d) {
        where.lastActive = { lte: subDays(new Date(), 7) };
      }

      if (recipientFilter.onboarded === false) {
        where.onboarded = false;
      }

      if (recipientFilter.noPWA === true) {
        where.isPWAInstalled = false;
      }

      if (specificEmail) where.email = specificEmail;
    }

    // 3. Fetch recipients
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // 4. Create notification record for tracking
    const notification = await (prisma as any).notification.create({
      data: {
        subject: "Feedback Request (Bulk)",
        body: "Feedback request email sent to filtered users",
        recipientCount: users.length,
        recipientFilter: JSON.stringify(recipientFilter || {}),
        status: "PROCESSING",
        adminName: "Admin"
      }
    });

    // 5. Send emails directly (sequentially to avoid Gmail rate limits)
    //    Bypasses BullMQ to avoid stale-worker issues from Next.js hot-reloads
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const result = await sendFeedbackRequestEmail(
          user.email,
          user.name || "User"
        );

        if (result.success) {
          successCount++;
          await logger.info(`Feedback request sent to ${user.email}`, null, "API");
        } else {
          failCount++;
          errors.push(`${user.email}: ${result.error}`);
          await logger.error(`Failed to send feedback request to ${user.email}`, { error: result.error }, "API");
        }
      } catch (err: any) {
        failCount++;
        errors.push(`${user.email}: ${err.message}`);
        await logger.error(`Exception sending to ${user.email}`, { error: err.message }, "API");
      }
    }

    // 6. Update notification status
    const finalStatus = failCount === 0 ? "SUCCESS" : (successCount === 0 ? "FAILED" : "PARTIAL");
    await (prisma as any).notification.update({
      where: { id: notification.id },
      data: { 
        status: finalStatus,
        ...(errors.length > 0 ? { error: errors.join("; ") } : {})
      }
    }).catch(() => {});

    if (failCount > 0 && successCount === 0) {
      return NextResponse.json(
        { error: `All ${failCount} emails failed. ${errors[0]}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      count: successCount,
      failed: failCount,
      message: `Successfully requested feedback from ${successCount} user${successCount !== 1 ? "s" : ""}${failCount > 0 ? ` (${failCount} failed)` : ""}`
    });

  } catch (error: any) {
    logger.error("Feedback Request API Error", { error: error.message });
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
