import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, color } = await req.json();

    const updated = await (prisma as any).category.update({
      where: { id },
      data: { name, color }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update subcategory:", error);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
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

    const sub = await prisma.category.findUnique({ where: { id } });
    if (sub) {
      const usageCount = await prisma.expense.count({
        where: { subcategory: sub.name }
      });

      if (usageCount > 0) {
        return NextResponse.json({ 
          error: `Used ${usageCount} times, cannot delete` 
        }, { status: 400 });
      }
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ message: "Subcategory deleted" });
  } catch (error) {
    console.error("Failed to delete subcategory:", error);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}
