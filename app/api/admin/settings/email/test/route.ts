import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

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
    const config = await req.json();
    
    // Test the provided config (don't save)
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port) || 465,
      secure: parseInt(config.port) === 465, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.verify();

    return NextResponse.json({ message: "SMTP connection successful!" });
  } catch (error: any) {
    console.error("SMTP Test Failed:", error);
    return NextResponse.json({ 
      error: "Connection failed", 
      details: error.message 
    }, { status: 400 });
  }
}
