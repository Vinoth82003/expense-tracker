import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/mail";
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

    // 3. Send emails (simplified loop)
    let successCount = 0;
    for (const user of users) {
      const personalizedBody = body.replace(/{userName}/g, user.name || "User");
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          ${personalizedBody.replace(/\n/g, '<br/>')}
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;"/>
          <p style="font-size: 12px; color: #999;">
            You received this because you are a registered SpendWise user.
            <br/>
            To stop receiving these emails, please unsubscribe in your settings.
          </p>
        </div>
      `;

      const result = await sendEmail(user.email, subject, html);
      if (result.success) successCount++;
    }

    // 4. Log in history
    await (prisma as any).notification.create({
      data: {
        subject,
        body,
        recipientCount: users.length,
        recipientFilter: JSON.stringify(recipientFilter),
        status: "SENT",
        adminName
      }
    });

    return NextResponse.json({ 
      message: `Announcement sent successfully to ${successCount} users.`,
      count: successCount 
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
