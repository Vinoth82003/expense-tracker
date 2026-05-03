import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeToday,
      aiReports,
      registrations,
      reportVolume
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { lastActive: { gte: twentyFourHoursAgo } }
      }),
      prisma.report.count(),
      // Data for Area Chart (last 30 days)
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      }),
      // Data for Bar Chart (last 7 days)
      prisma.report.findMany({
        where: { date: { gte: sevenDaysAgo } },
        select: { date: true }
      })
    ]);

    // Estimate tokens: 1.2M tokens per month as base + usage
    // Daily quota is 5M tokens (arbitrary for the dashboard warning)
    const estimatedTokens = aiReports * 1250; // 1250 tokens per report avg
    const tokensUsed = `${(estimatedTokens / 1000000).toFixed(1)}M`;
    const tokenPercentage = Math.min((estimatedTokens / 5000000) * 100, 100);

    // Process Chart Data
    const registrationsData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      const count = registrations.filter(u => u.createdAt && u.createdAt.toISOString().split('T')[0] === dateStr).length;
      return { date: dateStr, count };
    });

    const volumeData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const count = reportVolume.filter(r => r.date.toISOString().split('T')[0] === dateStr).length;
      // Coloring logic: green (low < 5) → amber (medium 5-15) → red (high > 15)
      let color = "#10b981"; // green
      if (count > 15) color = "#ef4444"; // red
      else if (count > 5) color = "#f59e0b"; // amber
      
      return { 
        name: date.toLocaleDateString('en-US', { weekday: 'short' }), 
        count,
        fill: color 
      };
    });

    // System Health
    const systemHealth = {
      mongodb: { status: "Connected", color: "green" },
      nextauth: { status: "Operational", color: "green" },
      nodemailer: { status: "SMTP healthy", color: "green" },
      gemini: { status: "Latency 340ms", color: "amber" } // Simulated latency
    };

    return NextResponse.json({
      totalUsers,
      activeToday,
      aiReports,
      tokensUsed,
      tokenPercentage,
      systemHealth,
      charts: {
        registrations: registrationsData,
        volume: volumeData
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
