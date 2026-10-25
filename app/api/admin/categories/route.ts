import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { validateCategoryInput } from "@/lib/admin/category-validation";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { isDefault: true },
    });

    // Calculate usage count and volume per category
    const formattedCategories = await Promise.all(categories.map(async (cat) => {
      const [usageCount, aggregate] = await Promise.all([
        prisma.expense.count({ where: { subcategory: cat.name } }),
        prisma.expense.aggregate({
          where: { subcategory: cat.name },
          _sum: { amount: true },
        }),
      ]);
      return { ...cat, usageCount, volume: aggregate._sum.amount || 0 };
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("[API] Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = validateCategoryInput(body, "global");
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, type, color, icon } = parsed.value;

    // Scope-aware duplicate check: only collide with other GLOBAL categories.
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        isDefault: true,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `A global category named "${name}" already exists.` },
        { status: 409 }
      );
    }

    const created = await prisma.category.create({
      data: { name, type, color: color || undefined, icon: icon || undefined, isDefault: true },
    });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "CATEGORY_CREATED",
      target: `category:${created.id}`,
      details: `Created global category "${name}" (${type})`,
      ip,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
