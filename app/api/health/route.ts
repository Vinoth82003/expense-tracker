import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check Database connection
    await prisma.user.findFirst();
    
    return NextResponse.json(
      { 
        status: "operational",
        services: {
          database: "connected",
          api: "healthy",
          server: "online"
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { 
        status: "degraded",
        services: {
          database: "disconnected",
          api: "healthy",
          server: "online"
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
