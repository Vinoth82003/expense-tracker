import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Update ALL docs to have current timestamps if they are missing
    // Since these fields are new, setting them for everyone is the safest way to clear nulls
    const result = await prisma.doc.updateMany({
      data: { 
        createdAt: now,
        updatedAt: now
      } as any
    });

    return NextResponse.json({ 
      message: "Migration completed", 
      count: result.count
    }, { status: 200 });
  } catch (error: any) {
    console.error("Migration failed", error);
    // SECURITY FIX: VULN-010 — Return generic error, log details server-side
    console.error("Migration failed", error);
    return NextResponse.json({ 
      message: "Migration failed" 
    }, { status: 500 });
  }
}
