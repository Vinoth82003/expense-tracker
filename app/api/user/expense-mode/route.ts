import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const userId = (session.user as any).id;
  
  try {
    const { expenseMode } = await req.json();
    if (expenseMode !== "limit" && expenseMode !== "no-limit") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { expenseMode }
    });

    return NextResponse.json({ success: true, expenseMode: updatedUser.expenseMode });
  } catch (error) {
    console.error("Failed to update expense mode:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
