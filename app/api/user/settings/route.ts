import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { expenseMode, monthlyLimit } = body;

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(expenseMode && { expenseMode }),
        ...(monthlyLimit !== undefined && { monthlyLimit: parseFloat(monthlyLimit) }),
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
