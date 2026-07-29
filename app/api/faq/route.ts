import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// SECURITY FIX: VULN-002 — Added admin auth check to POST handler
// SECURITY FIX: VULN-013 — Replaced new PrismaClient() with shared singleton

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { order: "asc" }
    });
    return NextResponse.json(faqs, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch FAQs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // SECURITY FIX: VULN-002 — Require admin session for write operations
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, answer, category, order } = await req.json();

    // SECURITY FIX: VULN-002 — Validate required fields
    if (!question || !answer || !category) {
      return NextResponse.json({ error: "Question, answer, and category are required" }, { status: 400 });
    }

    const faq = await prisma.fAQ.create({
      data: { question, answer, category, order: parseInt(order) || 0 }
    });
    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    // SECURITY FIX: VULN-010 — Return generic error, log details server-side
    console.error("Failed to create FAQ:", error);
    return NextResponse.json({ message: "Failed to create FAQ" }, { status: 500 });
  }
}
