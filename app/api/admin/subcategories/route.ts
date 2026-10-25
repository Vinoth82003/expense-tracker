import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { findDuplicateGroups } from "@/lib/admin/category-dedupe";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // Parent type (Needs/Wants)
    const userId = searchParams.get("userId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = 25;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = { isDefault: false, userId: { not: null } };
    if (category && (category === "Needs" || category === "Wants")) where.type = category;
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) where.userId = userId;

    // Free-text search doubles as the owner filter: it matches the subcategory
    // name or the owning user's name/email.
    const search = searchParams.get("search")?.trim().slice(0, 120);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        {
          user: {
            is: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

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

    // Duplicate detection runs over the *whole* filtered set, not just the
    // current page, so "Food" on page 3 still groups with "food" on page 1.
    const allNames = await prisma.category.findMany({ where, select: { name: true } });
    const duplicates = findDuplicateGroups(allNames.map((c) => c.name));

    return NextResponse.json({
      subcategories: formattedSubcategories,
      total,
      duplicates
    });
  } catch (error) {
    console.error("Failed to fetch admin subcategories:", error);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}
