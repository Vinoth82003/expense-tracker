import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendAdminDataWipeNotification } from "@/lib/mail";

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

    // Count first so the admin notification can report exactly what was lost.
    const [expenseCount, incomeCount] = await Promise.all([
      prisma.expense.count({ where: { userId: user.id } }),
      prisma.income.count({ where: { userId: user.id } }),
    ]);

    // Delete all expenses and incomes for this user
    await prisma.$transaction([
      prisma.expense.deleteMany({
        where: { userId: user.id }
      }),
      prisma.income.deleteMany({
        where: { userId: user.id }
      })
    ]);

    // Notify the admin last, and never let a mail failure undo or mask the
    // wipe — the user's request already succeeded at this point.
    sendAdminDataWipeNotification(
      user.email,
      user.name || "",
      expenseCount,
      incomeCount
    ).catch((err) => console.error("Data-wipe admin notification failed:", err));

    return NextResponse.json({ message: "Successfully wiped all transaction data." });

  } catch (error) {
    console.error("Failed to wipe data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
