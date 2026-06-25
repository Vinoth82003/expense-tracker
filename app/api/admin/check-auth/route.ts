import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (isAdmin) {
    return NextResponse.json({ authenticated: true }, { status: 200 });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
