import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/mail";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { templateId, subject, body } = await req.json();
    
    // In a real app, we'd get the admin's actual email from their session
    // For now, we'll use a placeholder or check process.env.SMTP_USER
    const adminEmail = process.env.SMTP_USER;

    if (!adminEmail) {
      return NextResponse.json({ error: "Admin email not configured" }, { status: 400 });
    }

    let finalSubject = subject;
    let finalBody = body;

    if (templateId) {
      const template = await (prisma as any).emailTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        finalSubject = template.subject;
        finalBody = template.body;
      }
    }

    // Substitute sample values
    const sampleValues: any = {
      userName: "Admin Test",
      code: "123456",
      amount: "5,000",
      limit: "10,000",
      date: new Date().toLocaleDateString()
    };

    let processedSubject = finalSubject;
    let processedBody = finalBody;

    Object.entries(sampleValues).forEach(([key, val]: any) => {
      const regex = new RegExp(`{${key}}`, "g");
      processedSubject = processedSubject.replace(regex, val);
      processedBody = processedBody.replace(regex, val);
    });

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2px dashed #00D4AA; border-radius: 12px;">
        <p style="text-align: center; color: #00D4AA; font-weight: bold; margin-bottom: 20px;">--- TEST PREVIEW ---</p>
        ${processedBody.replace(/\n/g, '<br/>')}
      </div>
    `;

    const result = await sendEmail(adminEmail, `[TEST] ${processedSubject}`, html);

    if (result.success) {
      return NextResponse.json({ message: "Test email sent to admin successfully." });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
