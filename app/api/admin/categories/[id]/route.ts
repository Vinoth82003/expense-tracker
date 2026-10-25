import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { prismaErrorCode } from "@/lib/admin/errors";
import { validateCategoryInput } from "@/lib/admin/category-validation";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!OBJECT_ID.test(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = validateCategoryInput(body, "global");
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, type, color, icon } = parsed.value;

    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Scope-aware duplicate check: another global category with the same name.
    if (name.toLowerCase() !== current.name.toLowerCase()) {
      const existing = await prisma.category.findFirst({
        where: { name: { equals: name, mode: "insensitive" }, isDefault: true, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: `A global category named "${name}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, type, color: color || undefined, icon: icon || undefined },
    });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "CATEGORY_UPDATED",
      target: `category:${id}`,
      details: `Updated global category (Before="${current.name}/${current.type}", After="${name}/${type}")`,
      ip,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    console.error("[API] Failed to update category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!OBJECT_ID.test(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const usageCount = await prisma.expense.count({ where: { subcategory: category.name } });
    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${usageCount} transaction(s) still use "${category.name}". Merge or re-tag them first.`,
          usage: usageCount,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "CATEGORY_DELETED",
      target: `category:${id}`,
      details: `Deleted global category "${category.name}" (${category.type})`,
      ip,
    });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    console.error("[API] Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
