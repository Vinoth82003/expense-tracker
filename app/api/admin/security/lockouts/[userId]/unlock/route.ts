import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAutomatedEmail } from "@/lib/mail";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        isLocked: false, 
        lockedAt: null, 
        lockReason: null 
      },
      select: { email: true, name: true }
    });

    await sendAutomatedEmail(user.email, "accountUnlock", {
      userName: user.name || "User"
    });

    return NextResponse.json({ message: "Account unlocked successfully" });
  } catch (error) {
    console.error("Failed to unlock account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
