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
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await (prisma as any).securityAlert.update({
      where: { id },
      data: { status: "DISMISSED" }
    });

    return NextResponse.json({ message: "Alert dismissed" });
  } catch (error) {
    console.error("Failed to dismiss alert:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
