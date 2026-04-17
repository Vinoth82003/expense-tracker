import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all expenses and incomes for this user
    await prisma.$transaction([
      prisma.expense.deleteMany({
        where: { userId: user.id }
      }),
      prisma.income.deleteMany({
        where: { userId: user.id }
      })
    ]);

    return NextResponse.json({ message: "Successfully wiped all transaction data." });

  } catch (error) {
    console.error("Failed to wipe data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
