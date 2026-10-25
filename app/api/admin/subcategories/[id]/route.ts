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
      return NextResponse.json({ error: "Invalid subcategory id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = validateCategoryInput(body, "sub");
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, color } = parsed.value;

    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    // Scope-aware duplicate check: only collide with this user's own subcategories.
    if (name.toLowerCase() !== current.name.toLowerCase() && current.userId) {
      const existing = await prisma.category.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          isDefault: false,
          userId: current.userId,
          NOT: { id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `This user already has a subcategory named "${name}".` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, color: color || undefined },
    });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "SUBCATEGORY_UPDATED",
      target: `subcategory:${id}`,
      details: `Updated subcategory (Before="${current.name}", After="${name}")`,
      ip,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }
    console.error("[API] Failed to update subcategory:", error);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid subcategory id" }, { status: 400 });
    }

    const sub = await prisma.category.findUnique({ where: { id } });
    if (!sub) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    const usageCount = await prisma.expense.count({ where: { subcategory: sub.name } });
    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: used by ${usageCount} transaction(s). Merge or re-tag them first.`,
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
      actionType: "SUBCATEGORY_DELETED",
      target: `subcategory:${id}`,
      details: `Deleted subcategory "${sub.name}"`,
      ip,
    });

    return NextResponse.json({ message: "Subcategory deleted" });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }
    console.error("[API] Failed to delete subcategory:", error);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}
