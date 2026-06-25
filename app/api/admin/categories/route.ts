import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { isDefault: true, userId: null },
      orderBy: { name: 'asc' }
    });

    // For each category, get usage stats
    const formattedCategories = await Promise.all(categories.map(async (cat) => {
      const transactionCount = await prisma.expense.count({
        where: { subcategory: cat.name }
      });
      const transactionVolume = await prisma.expense.aggregate({
        where: { subcategory: cat.name },
        _sum: { amount: true }
      });

      return {
        ...cat,
        usageCount: transactionCount,
        volume: transactionVolume._sum.amount || 0
      };
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("Failed to fetch admin categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, type, icon, color } = await req.json();

    const category = await (prisma as any).category.create({
      data: {
        name,
        type,
        icon,
        color,
        isDefault: true,
        userId: null
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create admin category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
