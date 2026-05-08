import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await (prisma as any).unsubscribe.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "User re-subscribed successfully" });
  } catch (error) {
    console.error("Failed to delete unsubscribe record:", error);
    return NextResponse.json({ error: "Failed to re-subscribe user" }, { status: 500 });
  }
}
