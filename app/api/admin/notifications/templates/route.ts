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
    name: "Welcome email",
    subject: "Welcome to SpendWise, {userName}!",
    body: "Hi {userName},\n\nWe're excited to have you on board! Start tracking your expenses and gain forensic insights into your spending habits today.",
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
