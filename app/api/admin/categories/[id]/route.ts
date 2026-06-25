import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const category = await (prisma as any).category.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        icon: body.icon,
        color: body.color
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update admin category:", error);
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

    // Check for transactions referencing this category name
    const category = await prisma.category.findUnique({ where: { id } });
    if (category) {
      const transactionCount = await prisma.expense.count({
        where: { subcategory: category.name }
      });

      if (transactionCount > 0) {
        return NextResponse.json({ 
          error: `Cannot delete — ${transactionCount} transactions reference this category` 
        }, { status: 400 });
      }
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Failed to delete admin category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
