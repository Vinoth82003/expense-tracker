import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        expenses: {
          orderBy: { date: 'desc' }
        },
        incomes: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare CSV data
    const rows = [
      ["Type", "Amount", "Category/Source", "Subcategory", "Date", "Notes", "Recorded At"]
    ];

    // Add Expenses
    user.expenses.forEach(e => {
      rows.push([
        "Expense",
        e.amount.toString(),
        e.category,
        e.subcategory,
        e.date.toISOString(),
        e.note || "",
        e.createdAt.toISOString()
      ]);
    });

    // Add Incomes
    user.incomes.forEach(i => {
      rows.push([
        "Income",
        i.amount.toString(),
        "Income",
        i.source,
        i.date.toISOString(),
        i.note || "",
        i.createdAt.toISOString()
      ]);
    });

    // Convert to CSV string
    const csvContent = rows.map(r => r.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=spendwise_export_${new Date().toISOString().split('T')[0]}.csv`
      }
    });

  } catch (error) {
    console.error("Failed to export data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
