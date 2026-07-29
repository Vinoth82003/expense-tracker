import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";

// SECURITY FIX: VULN-009/VULN-022 — Added auth requirement for doc feedback

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY FIX: VULN-009 — Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY FIX: VULN-020 — CSRF origin validation
    const csrfCheck = validateOrigin(req);
    if (csrfCheck) return csrfCheck;

    const { id } = await params;
    const { helpful } = await req.json();

    if (typeof helpful !== "boolean") {
      return NextResponse.json({ error: "Invalid feedback value" }, { status: 400 });
    }

    const updateData = helpful 
      ? { helpfulCount: { increment: 1 } } 
      : { notHelpfulCount: { increment: 1 } };

    const doc = await prisma.doc.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, doc }, { status: 200 });
  } catch (error) {
    console.error("Feedback failed", error);
    return NextResponse.json({ message: "Failed to submit feedback" }, { status: 500 });
  }
}
