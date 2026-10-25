import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAIL_JOB_STALE_MS } from "@/lib/email-jobs";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const healthCheckedAt = now.toISOString();

    const [
      totalUsers,
      activeToday,
      activeYesterday,
      newUsersToday,
      newUsersYesterday,
      aiReports,
      aiReportsToday,
      registrations,
      reportVolume,
      totalTokensAgg,
      pwaInstalls
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { lastActive: { gte: twentyFourHoursAgo } }
      }),
      prisma.user.count({
        where: { lastActive: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: twentyFourHoursAgo } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo } }
      }),
      prisma.report.count(),
      prisma.report.count({ where: { date: { gte: twentyFourHoursAgo } } }),
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

    const aiSettingsRow = await prisma.settings.findUnique({ where: { key: 'aiSettings' } });
    let maxTokens = 5000000;
    if (aiSettingsRow) {
      try { maxTokens = JSON.parse(aiSettingsRow.value).maxTokens || maxTokens; } catch {}
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

    // System Health — each card reflects a real, cheap check with a shared
    // freshness timestamp. We never claim a live provider call for SMTP/Gemini,
    // only whether the dependency is configured; the status wording says so.
    let mongoStatus = { status: "Connected", color: "green", scope: "Database ping" };
    try {
      await prisma.$runCommandRaw({ ping: 1 });
    } catch {
      mongoStatus = { status: "Disconnected", color: "red", scope: "Database ping" };
    }

    const configured = (present: boolean, label: string) =>
      present
        ? { status: "Configured", color: "green", scope: label }
        : { status: "Not configured", color: "red", scope: label };

    // Email jobs — a stuck/unfinished queue is the failure mode the SMTP
    // "configured" flag alone cannot show. Stuck = PROCESSING past the stale
    // window (processingAt, or createdAt for legacy rows that never set it).
    const staleBefore = new Date(now.getTime() - MAIL_JOB_STALE_MS);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let mailJobs = { recent: 0, stuck: 0, failed: 0 };
    try {
      const [recent, stuck, failed] = await Promise.all([
        prisma.notification.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.notification.count({
          where: {
            status: "PROCESSING",
            OR: [
              { processingAt: { lt: staleBefore } },
              { processingAt: null, createdAt: { lt: staleBefore } },
            ],
          },
        }),
        prisma.notification.count({
          where: { createdAt: { gte: dayAgo }, status: "FAILED" },
        }),
      ]);
      mailJobs = { recent, stuck, failed };
    } catch {
      /* health probe is best-effort */
    }

    const smtpConfigured = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    );
    const staleMinutes = Math.round(MAIL_JOB_STALE_MS / 60000);
    let emailStatus: { status: string; color: string; scope: string };
    if (!smtpConfigured) {
      emailStatus = {
        status: "Not configured",
        color: "red",
        scope: "SMTP credentials absent (no delivery possible)",
      };
    } else if (mailJobs.stuck > 0) {
      emailStatus = {
        status: `${mailJobs.stuck} stuck`,
        color: "red",
        scope: `${mailJobs.stuck} job(s) still PROCESSING beyond ${staleMinutes}m — inspect Notifications`,
      };
    } else if (mailJobs.failed > 0) {
      emailStatus = {
        status: "Degraded",
        color: "amber",
        scope: `${mailJobs.failed} failed job(s) in the last 24h — retry from Notifications`,
      };
    } else {
      emailStatus = {
        status: "Configured",
        color: "green",
        scope: `${mailJobs.recent} job(s) in the last 24h; SMTP configured (not a delivery test)`,
      };
    }

    const systemHealth = {
      mongodb: mongoStatus,
      nextauth: configured(Boolean(process.env.NEXTAUTH_SECRET), "Session signing secret present"),
      nodemailer: configured(
        smtpConfigured,
        "SMTP credentials present (not a delivery test)"
      ),
      emailJobs: emailStatus,
      gemini: configured(Boolean(process.env.GEMINI_API_KEY), "API key present (not a live call)"),
    };

    return NextResponse.json({
      totalUsers,
      activeToday,
      activeDelta: activeToday - activeYesterday,
      activeYesterday,
      newUsersToday,
      newUsersYesterday,
      aiReports,
      aiReportsToday,
      tokensUsed,
      tokenPercentage,
      pwaInstalls,
      mailJobs,
      systemHealth,
      healthCheckedAt,
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

