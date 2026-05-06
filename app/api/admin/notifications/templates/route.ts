import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

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
  }
];

export async function GET() {
  if (!(await isAdmin())) {
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
  if (!(await isAdmin())) {
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
