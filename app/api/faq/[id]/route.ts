import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// SECURITY FIX: VULN-002 — Added admin auth check to PATCH and DELETE handlers
// SECURITY FIX: VULN-013 — Replaced new PrismaClient() with shared singleton

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SECURITY FIX: VULN-002 — Require admin session
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const { question, answer, category, order } = await req.json();
    
    const faq = await prisma.fAQ.update({
      where: { id },
      data: { question, answer, category, order: parseInt(order) || 0 }
    });
    
    return NextResponse.json(faq, { status: 200 });
  } catch (error) {
    console.error("Failed to update FAQ:", error);
    return NextResponse.json({ message: "Failed to update FAQ" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SECURITY FIX: VULN-002 — Require admin session
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    await prisma.fAQ.delete({
      where: { id }
    });
    return NextResponse.json({ message: "FAQ deleted" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete FAQ:", error);
    return NextResponse.json({ message: "Failed to delete FAQ" }, { status: 500 });
  }
}
