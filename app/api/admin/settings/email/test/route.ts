import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config: any;
  try {
    config = await req.json();
    
    // Test the provided config (don't save)
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port) || 587,
      secure: parseInt(config.port) === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    await transporter.verify();

    await logger.info("SMTP Test Connection Successful", { host: config.host, port: config.port }, "MAIL");
    return NextResponse.json({ message: "SMTP connection successful!" });
  } catch (error: any) {
    console.error("SMTP Test Failed:", error);
    await logger.error(`SMTP Test Failed: ${error.message}`, { 
      host: config?.host, 
      port: config?.port,
      code: error.code 
    }, "MAIL");
    return NextResponse.json({ 
      error: error.message || "Connection failed", 
      details: error.code || "UNKNOWN_ERROR"
    }, { status: 400 });
  }
}
