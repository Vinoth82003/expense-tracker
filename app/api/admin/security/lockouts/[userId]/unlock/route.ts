import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { sendAutomatedEmail } from "@/lib/mail";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!(await isAdmin())) {
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
