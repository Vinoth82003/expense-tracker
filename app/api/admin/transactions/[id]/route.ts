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

  try {
    const { id } = await params;
    const { type, reason } = await req.json();

    if (type === 'expense') {
      await prisma.expense.delete({ where: { id } });
    } else {
      await prisma.income.delete({ where: { id } });
    }

    // Log administrative action
    console.log(`Admin deleted ${type} ${id} for reason: ${reason}`);

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
