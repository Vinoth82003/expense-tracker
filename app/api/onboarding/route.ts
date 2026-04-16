import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { expenseMode, monthlyLimit } = body;

    if (!expenseMode || !["limit", "no-limit"].includes(expenseMode)) {
      return NextResponse.json(
        { error: "Invalid expense mode" },
        { status: 400 },
      );
    }

    if (expenseMode === "limit" && (!monthlyLimit || monthlyLimit <= 0)) {
      return NextResponse.json(
        { error: "Monthly limit must be greater than 0" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        expenseMode,
        monthlyLimit: expenseMode === "limit" ? Number(monthlyLimit) : null,
        onboarded: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        expenseMode: updatedUser.expenseMode,
        monthlyLimit: updatedUser.monthlyLimit,
        onboarded: updatedUser.onboarded,
      },
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
