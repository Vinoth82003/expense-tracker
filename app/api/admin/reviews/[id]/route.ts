import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";

const ALLOWED_STATUS = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const status = body?.status;
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";

    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // A rejection must carry a reason so the audit trail explains the decision.
    if (status === "REJECTED" && !reason) {
      return NextResponse.json(
        { error: "A reason is required to reject a review." },
        { status: 400 }
      );
    }

    const existing = await prisma.review.findUnique({
      where: { id },
      select: { status: true, user: { select: { email: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Idempotent: re-issuing the same status is a no-op, not an error.
    if (existing.status === status) {
      const current = await prisma.review.findUnique({ where: { id } });
      return NextResponse.json(current);
    }

    const adminInfo = await getAdminInfo();
    const review = await prisma.review.update({
      where: { id },
      data: {
        status,
        moderationReason: reason || null,
        moderatedAt: new Date(),
        moderatedBy: adminInfo?.adminName ?? adminInfo?.adminId ?? "admin",
      },
    });

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "REVIEW_MODERATED",
      target: existing.user?.email || id,
      details: `Review ${id}: ${existing.status} → ${status}${reason ? ` (reason: ${reason})` : ""}`,
      ip,
    });

    return NextResponse.json(review);
  } catch (error) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    console.error("Error updating review status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({
      where: { id },
      select: { status: true, user: { select: { email: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "REVIEW_DELETED",
      target: existing.user?.email || id,
      details: `Deleted review ${id} (was ${existing.status})`,
      ip,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
