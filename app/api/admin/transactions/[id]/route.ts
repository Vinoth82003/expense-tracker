import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { prismaErrorCode } from "@/lib/admin/errors";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid transaction id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const type = body?.type;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (type !== "expense" && type !== "income") {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }
    if (reason.length < 3) {
      return NextResponse.json({ error: "A reason (at least 3 characters) is required." }, { status: 400 });
    }

    if (type === "expense") {
      await prisma.expense.delete({ where: { id } });
    } else {
      await prisma.income.delete({ where: { id } });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const adminInfo = await getAdminInfo();
    await logAudit({
      adminName: adminInfo?.adminName,
      adminId: adminInfo?.adminId,
      actionType: "TRANSACTION_DELETED",
      target: `${type}:${id}`,
      details: `Deleted ${type} ${id}. Reason: ${reason}`,
      ip,
    });

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    console.error("Failed to delete transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
