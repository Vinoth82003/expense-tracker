import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { prismaErrorCode } from "@/lib/admin/errors";
import { revalidateTag } from "next/cache";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sourceId = typeof body?.sourceId === "string" ? body.sourceId : "";
    const targetId = typeof body?.targetId === "string" ? body.targetId : "";

    if (!OBJECT_ID.test(sourceId) || !OBJECT_ID.test(targetId)) {
      return NextResponse.json({ error: "Invalid source or target id" }, { status: 400 });
    }
    if (sourceId === targetId) {
      return NextResponse.json({ error: "Source and target must be different." }, { status: 400 });
    }

    const [source, target] = await Promise.all([
      prisma.category.findUnique({ where: { id: sourceId } }),
      prisma.category.findUnique({ where: { id: targetId } }),
    ]);
    if (!source || !target) {
      return NextResponse.json({ error: "Source or target not found" }, { status: 404 });
    }

    // Idempotent: re-tagging by name when names already match is a no-op.
    let moved = 0;
    if (source.name !== target.name) {
      const result = await prisma.expense.updateMany({
        where: { subcategory: source.name },
        data: { subcategory: target.name },
      });
      moved = result.count;
    }

    await prisma.category.delete({ where: { id: sourceId } });
    revalidateTag("global-categories", "max");

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "CATEGORY_MERGED",
      target: `subcategory:${sourceId}->${targetId}`,
      details: `Merged "${source.name}" into "${target.name}" (${moved} transaction(s) re-tagged)`,
      ip,
    });

    return NextResponse.json({
      success: true,
      moved,
      message: `Merged "${source.name}" into "${target.name}" (${moved} transaction(s) re-tagged)`,
    });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Source or target no longer exists" }, { status: 404 });
    }
    console.error("[API] Failed to merge subcategories:", error);
    return NextResponse.json({ error: "Failed to merge" }, { status: 500 });
  }
}
