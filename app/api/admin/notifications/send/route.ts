import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { emailQueue } from "@/lib/queue";
import { subDays } from "date-fns";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

async function getAdminName() {
  // Mocking for now, in real app we'd get from session
  return "Admin";
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, body, recipientFilter } = await req.json();
    const adminName = await getAdminName();

    // 1. Fetch unsubscribed emails
    const unsubscribed = await (prisma as any).unsubscribe.findMany({
      select: { email: true }
    });
    const unsubscribedEmails = unsubscribed.map((u: any) => u.email);

    // 2. Build user query based on filter
    const where: any = {
      email: { notIn: unsubscribedEmails }
    };

    if (recipientFilter) {
      if (recipientFilter.twoFactorEnabled) where.twoFactorEnabled = true;
      if (recipientFilter.limitMode) where.expenseMode = "limit";
      if (recipientFilter.active30d) {
        where.lastActive = { gte: subDays(new Date(), 30) };
      }
      if (recipientFilter.newUsers) {
        where.createdAt = { gte: subDays(new Date(), 7) };
      }
      if (recipientFilter.specificEmail) {
        where.email = recipientFilter.specificEmail;
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // 3. Enqueue emails (using BullMQ)
    let enqueuedCount = 0;
    
    // Log the notification in history FIRST, to get the notification ID
    const notification = await (prisma as any).notification.create({
      data: {
        subject,
        body,
        recipientCount: users.length,
        recipientFilter: JSON.stringify(recipientFilter),
        status: "PROCESSING",
        adminName
      }
    });

    const jobs = users.map(user => ({
      name: 'send-email',
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        subject,
        body,
        notificationId: notification.id
      }
    }));

    // Add jobs in bulk
    await emailQueue.addBulk(jobs);
    enqueuedCount = users.length;

    // Update notification status to SUCCESS
    await (prisma as any).notification.update({
      where: { id: notification.id },
      data: { status: "SUCCESS" }
    });

    return NextResponse.json({ 
      message: `Announcement queued for delivery to ${enqueuedCount} users.`,
      count: enqueuedCount 
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
