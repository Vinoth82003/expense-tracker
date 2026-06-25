import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch active security alerts
    const securityAlerts = await prisma.securityAlert.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // Fetch recent critical/error/warn system logs
    const systemLogs = await prisma.systemLog.findMany({
      where: {
        level: {
          in: ["CRITICAL", "ERROR", "WARN"],
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // Map security alerts to notification format
    const mappedSecurityAlerts = securityAlerts.map((alert) => ({
      id: alert.id,
      title: `Security: ${alert.type.replace(/_/g, " ")}`,
      description: alert.description,
      type: alert.severity.toLowerCase() === "critical" ? "error" : "warning",
      timestamp: alert.createdAt.toISOString(),
      read: false,
      model: "SecurityAlert",
    }));

    // Map system logs to notification format
    const mappedSystemLogs = systemLogs.map((log) => ({
      id: log.id,
      title: `System ${log.level}: ${log.service}`,
      description: log.message,
      type: log.level === "CRITICAL" || log.level === "ERROR" ? "error" : "warning",
      timestamp: log.createdAt.toISOString(),
      read: false,
      model: "SystemLog",
    }));

    // Combine and sort by timestamp
    const allAlerts = [...mappedSecurityAlerts, ...mappedSystemLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(allAlerts.slice(0, 30));
  } catch (error) {
    console.error("Failed to fetch admin alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, readAll } = await req.json();

    if (readAll) {
      // Dismiss all security alerts
      await prisma.securityAlert.updateMany({
        where: { status: "ACTIVE" },
        data: { status: "DISMISSED" },
      });
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (id) {
      // Check if it's a security alert and dismiss it
      try {
        await prisma.securityAlert.update({
          where: { id },
          data: { status: "DISMISSED" },
        });
      } catch (e) {
        // If not a security alert (e.g. it's a SystemLog), we just ignore or handle differently
        // Since SystemLogs aren't dismissible in DB, we'd need a different mechanism for "read" logs.
      }
    }

    return NextResponse.json({ message: `Notification ${id} marked as read` });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Clear all active security alerts
    await prisma.securityAlert.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "DISMISSED" },
    });
    return NextResponse.json({ message: "All notifications cleared" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear alerts" }, { status: 500 });
  }
}
