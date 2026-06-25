import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sourceId, targetId } = await req.json();

    const source = await prisma.category.findUnique({ where: { id: sourceId } });
    const target = await prisma.category.findUnique({ where: { id: targetId } });

    if (!source || !target) {
      return NextResponse.json({ error: "Source or target not found" }, { status: 404 });
    }

    // Update all expenses with source name to target name
    await prisma.expense.updateMany({
      where: { subcategory: source.name },
      data: { subcategory: target.name }
    });

    // Delete source category
    await prisma.category.delete({ where: { id: sourceId } });

    // Invalidate cache
    (revalidateTag as any)('global-categories');

    return NextResponse.json({ 
      success: true, 
      message: `Merged '${source.name}' into '${target.name}'` 
    });
  } catch (error) {
    console.error("Failed to merge subcategories:", error);
    return NextResponse.json({ error: "Failed to merge" }, { status: 500 });
  }
}
