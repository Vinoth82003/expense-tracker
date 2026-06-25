import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAutomatedEmail } from "@/lib/mail";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.user.update({
      where: { id },
      data: {
        twoFactorEnabled: false,
        twoFactorOTP: null,
        twoFactorOTPExpires: null,
      },
    });

    const user = await prisma.user.findUnique({ where: { id }, select: { email: true, name: true } });
    if (user) {
      await sendAutomatedEmail(user.email, "twoFactorOverride", {
        userName: user.name || "User",
        reason: "Administrative Reset"
      });
    }

    return NextResponse.json({ message: "2FA reset successfully" });
  } catch (error) {
    console.error("Failed to reset 2FA:", error);
    return NextResponse.json({ error: "Failed to reset 2FA" }, { status: 500 });
  }
}
