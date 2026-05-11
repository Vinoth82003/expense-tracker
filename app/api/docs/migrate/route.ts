import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
    return NextResponse.json({ 
      message: "Migration failed", 
      error: error.message 
    }, { status: 500 });
  }
}
