import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
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
