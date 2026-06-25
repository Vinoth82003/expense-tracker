import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // Parent type (Needs/Wants)
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const skip = (page - 1) * limit;

    const where: any = { isDefault: false, userId: { not: null } };
    if (category && category !== "All") where.type = category;
    if (userId) where.userId = userId;

    const subcategories = await prisma.category.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit
    });

    const total = await prisma.category.count({ where });

    // Calculate usage count for each
    const formattedSubcategories = await Promise.all(subcategories.map(async (sub) => {
      const usageCount = await prisma.expense.count({
        where: { subcategory: sub.name }
      });
      return { ...sub, usageCount };
    }));

    return NextResponse.json({
      subcategories: formattedSubcategories,
      total
    });
  } catch (error) {
    console.error("Failed to fetch admin subcategories:", error);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}
