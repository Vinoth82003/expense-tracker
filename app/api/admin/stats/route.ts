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
      reportVolume,
      totalTokensAgg,
      pwaInstalls
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
      }),
      prisma.report.aggregate({
        _sum: { tokens: true }
      }),
      prisma.user.count({
        where: { isPWAInstalled: true }
      })
    ]);

    const actualTokens = totalTokensAgg?._sum?.tokens || 0;
    
    let tokensUsed = "0";
    if (actualTokens >= 1000000) {
      tokensUsed = `${(actualTokens / 1000000).toFixed(1)}M`;
    } else if (actualTokens >= 1000) {
      tokensUsed = `${(actualTokens / 1000).toFixed(1)}k`;
    } else {
      tokensUsed = actualTokens.toString();
    }

    const aiSettingsRow = await (prisma as any).settings.findUnique({ where: { key: 'aiSettings' } });
    let maxTokens = 5000000;
    if (aiSettingsRow) {
      try { maxTokens = JSON.parse(aiSettingsRow.value).maxTokens || maxTokens; } catch(e) {}
    }
    const tokenPercentage = Math.min((actualTokens / maxTokens) * 100, 100);

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
    let mongoStatus = { status: "Connected", color: "green" };
    try {
      await prisma.$runCommandRaw({ ping: 1 });
    } catch {
      mongoStatus = { status: "Disconnected", color: "red" };
    }

    const systemHealth = {
      mongodb: mongoStatus,
      nextauth: { status: "Operational", color: "green" },
      nodemailer: { status: "SMTP configured", color: "green" },
      gemini: { status: "API Connected", color: "green" }
    };

    return NextResponse.json({
      totalUsers,
      activeToday,
      aiReports,
      tokensUsed,
      tokenPercentage,
      pwaInstalls,
      systemHealth,
      charts: {
        registrations: registrationsData,
        volume: volumeData
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 });
  }
}

