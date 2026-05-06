import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { subDays } from "date-fns";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
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

    return NextResponse.json({ notification, recipients });
  } catch (error) {
    console.error("Failed to fetch notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
