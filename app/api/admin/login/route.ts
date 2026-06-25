import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signAdminSession } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminUser || !adminPass) {
      console.error("[SECURITY] ADMIN_USER or ADMIN_PASS environment variables are not set.");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    if (email === adminUser && password === adminPass) {
      // Generate a cryptographically signed session token
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const signedToken = await signAdminSession(nonce);

      const cookieStore = await cookies();
      cookieStore.set("admin_session", signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Invalid admin credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[ADMIN LOGIN] Error during admin authentication:", error);
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
