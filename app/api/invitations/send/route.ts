import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendGroupInvitationEmail } from "@/lib/mail";
import crypto from "crypto";
import { checkUserRateLimit } from "@/lib/rateLimit";
import { validateOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY FIX: VULN-020 — CSRF origin validation
    const csrfCheck = validateOrigin(req);
    if (csrfCheck) return csrfCheck;

    const { groupId, emails } = await req.json();

    if (!groupId || !emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "Group ID and email list are required" }, { status: 400 });
    }

    const requester = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!requester) {
      return NextResponse.json({ error: "Requester not found" }, { status: 404 });
    }

    // SECURITY FIX: VULN-023 — Rate limit invitation sending
    const rateLimitResult = await checkUserRateLimit(requester.id, "invite-send", 20, 60000);
    if (rateLimitResult) return rateLimitResult;

    const group = await (prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    let sentCount = 0;
    let failedCount = 0;

    // SECURITY FIX: VULN-026 — Validate email format server-side
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const email of emails) {
      try {
        if (!emailRegex.test(email)) {
          failedCount++;
          continue;
        }

        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await (prisma as any).invitation.create({
          data: {
            groupId,
            email,
            token,
            expiresAt,
          },
        });

        const inviteLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/groups/invite/${token}`;
        await sendGroupInvitationEmail(email, requester.name || requester.email, group.name, inviteLink);
        
        sentCount++;
      } catch (err) {
        console.error(`Failed to send invitation to ${email}:`, err);
        failedCount++;
      }
    }

    return NextResponse.json({ sent: sentCount, failed: failedCount });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
