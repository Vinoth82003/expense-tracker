import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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
    await (prisma as any).user.update({
      where: { id: userId },
      data: { 
        isSuspended: true, 
        suspensionReason: "Permanent ban for security reasons",
        isLocked: false // Clear temporary lock if it's now permanent
      }
    });

    return NextResponse.json({ message: "Account banned permanently" });
  } catch (error) {
    console.error("Failed to ban account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
