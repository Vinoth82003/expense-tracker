import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    // Delete the user record. 
    // Prisma cascading ensures that expenses, incomes, and categories (if set with onDelete: Cascade) are deleted.
    // Our schema has onDelete: Cascade for Expense, Income, and Category.
    await prisma.user.delete({
      where: { id: user.id }
    });

    return NextResponse.json({ message: "Account successfully deleted." });

  } catch (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
