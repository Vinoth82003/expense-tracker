import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (email === adminUser && password === adminPass) {
      // In a real app, use a secure JWT
      // For this implementation, we'll use a secure cookie
      const response = NextResponse.json({ success: true }, { status: 200 });
      
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    return NextResponse.json(
      { message: "Invalid admin credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
