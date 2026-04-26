import { NextRequest, NextResponse } from "next/server";
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
      select: { lastActive: true, streak: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const lastActive = user.lastActive ? new Date(user.lastActive) : null;
    
    let newStreak = user.streak;

    if (lastActive) {
      const diffInHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
      
      // If last active was between 24 and 48 hours ago, increment streak
      // If it was more than 48 hours ago, reset streak
      // If it was less than 24 hours ago, keep streak
      if (diffInHours >= 24 && diffInHours < 48) {
        newStreak += 1;
      } else if (diffInHours >= 48) {
        newStreak = 0;
      }
    } else {
      newStreak = 1; // First activity
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActive: now,
        streak: newStreak,
      },
    });

    return NextResponse.json({ success: true, streak: newStreak });
  } catch (error) {
    console.error("Failed to track activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
