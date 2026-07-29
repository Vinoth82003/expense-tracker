import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";

// SECURITY FIX: VULN-003 — HTML-escape email before rendering in response
// SECURITY FIX: VULN-016 — Changed from GET to POST to prevent CSRF/link prefetch abuse

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    // SECURITY FIX: VULN-020 — CSRF origin validation
    const csrfCheck = validateOrigin(req);
    if (csrfCheck) return csrfCheck;

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
    }

    const sanitizedEmail = escapeHtml(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "Email not registered" }, { status: 404 });
    }

    // Check if already unsubscribed
    const existing = await prisma.unsubscribe.findUnique({
      where: { email }
    });

    if (!existing) {
      await prisma.unsubscribe.create({
        data: {
          email,
          userId: user.id,
          reason: "Unsubscribed via email footer link"
        }
      });
    }

    // Return JSON instead of HTML to avoid XSS vectors
    return NextResponse.json({
      success: true,
      message: `Successfully unsubscribed ${sanitizedEmail}`
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
