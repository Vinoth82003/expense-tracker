import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #ef4444;">Invalid Request</h1>
          <p>Missing email parameter.</p>
          <a href="/" style="color: #0d9488; text-decoration: none;">Go to SpendWise</a>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return new NextResponse(
        `<html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #ef4444;">User Not Found</h1>
            <p>The email ${email} is not registered with SpendWise.</p>
            <a href="/" style="color: #0d9488; text-decoration: none;">Go to SpendWise</a>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
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

    return new NextResponse(
      `<html>
        <head>
          <title>Unsubscribed | SpendWise</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
          <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%;">
            <div style="width: 64px; height: 64px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h1 style="margin: 0 0 10px; color: #111827; font-size: 24px;">Unsubscribed</h1>
            <p style="color: #6b7280; line-height: 1.5; margin-bottom: 30px;">
              You've been successfully removed from our mailing list for <strong>${email}</strong>. 
              You will no longer receive monthly budget alerts or announcements.
            </p>
            <a href="/" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; transition: opacity 0.2s;">
              Return to Homepage
            </a>
            <p style="margin-top: 20px; font-size: 13px; color: #9ca3af;">
              Did you unsubscribe by mistake? <br/>
              Log in to your settings to re-enable notifications.
            </p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
