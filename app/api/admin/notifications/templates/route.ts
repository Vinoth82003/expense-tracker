import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_TEMPLATES = [
  {
    name: "2FA OTP email",
    subject: "Your SpendWise Security Code: {code}",
    body: "Hello {userName},\n\nYour one-time password for SpendWise is: {code}\n\nThis code will expire in 10 minutes.",
    isSystem: true
  },
  {
    name: "Budget alert email",
    subject: "Budget Alert: You've reached {amount} of your limit",
    body: "Hello {userName},\n\nThis is a friendly reminder that you have reached ₹{amount} of your monthly limit (₹{limit}) as of {date}.",
    isSystem: true
  },
  {
    name: "Maintenance announcement",
    subject: "SpendWise Scheduled Maintenance: {date}",
    body: "Hello {userName},\n\nWe would like to inform you that SpendWise will be undergoing scheduled maintenance on {date}.\n\nDuring this time, the application may be temporarily unavailable. We apologize for any inconvenience caused.\n\nReason: {reason}",
    isSystem: true
  },
  {
    name: "2FA Admin Override",
    subject: "Security Alert: 2FA Disabled by Administrator",
    body: "Hello {userName},\n\nThis is a formal notification that your Two-Factor Authentication (2FA) has been disabled by a SpendWise Administrator.\n\nReason provided: {reason}\n\nIf you did not request this, please secure your account immediately.",
    isSystem: true
  },
  {
    name: "Account Lockout",
    subject: "Security Alert: Your Account Has Been Locked",
    body: "Hello {userName},\n\nThis is a formal notification that your SpendWise account has been locked by an Administrator.\n\nReason provided: {reason}\n\nPlease contact support for further assistance and to resolve this issue.",
    isSystem: true
  },
  {
    name: "Account Suspension",
    subject: "Security Notice: Your Account Has Been Suspended",
    body: "Hello {userName},\n\nWe would like to inform you that your SpendWise account has been suspended by an Administrator.\n\nReason for suspension: {reason}\n\nDuring suspension, you will not be able to access your dashboard or track expenses. Please contact our support team if you believe this is an error.",
    isSystem: true
  },
  {
    name: "Account Reactivation",
    subject: "Welcome Back: Your SpendWise Account is Active",
    body: "Hello {userName},\n\nGreat news! Your SpendWise account has been reactivated by an Administrator.\n\nYou can now log in and continue tracking your finances as usual.\n\nThank you for your patience.",
    isSystem: true
  },
  {
    name: "Account Unlock",
    subject: "Security Update: Your Account Has Been Unlocked",
    body: "Hello {userName},\n\nThis is to inform you that your SpendWise account has been unlocked by an Administrator.\n\nYou should now be able to log in securely. We recommend reviewing your security settings and updating your password if you suspect any unauthorized access.",
    isSystem: true
  }
];

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Seed system templates if missing
    for (const t of SYSTEM_TEMPLATES) {
      await (prisma as any).emailTemplate.upsert({
        where: { name: t.name },
        update: { isSystem: true }, // Ensure isSystem is correct
        create: t
      });
    }

    const templates = await (prisma as any).emailTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, subject, body } = await req.json();

    const template = await (prisma as any).emailTemplate.create({
      data: {
        name,
        subject,
        body,
        isSystem: false
      }
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Failed to create template:", error);
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "Template with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
