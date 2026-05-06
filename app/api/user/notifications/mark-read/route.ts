import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { readNotificationIds: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { notificationId, allIds } = body;

    let newReadIds = [...user.readNotificationIds];

    if (allIds && Array.isArray(allIds)) {
      allIds.forEach((id: string) => {
        if (!newReadIds.includes(id)) {
          newReadIds.push(id);
        }
      });
    } else if (notificationId && !newReadIds.includes(notificationId)) {
      newReadIds.push(notificationId);
    } else {
      return NextResponse.json({ success: true, message: "Nothing to update" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { readNotificationIds: newReadIds },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
