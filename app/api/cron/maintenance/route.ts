import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminMaintenanceReport } from "@/lib/mail";
import { logger } from "@/lib/logger";
import { subDays, format } from "date-fns";

// Hourly maintenance worker, triggered by the Render Cron Job:
//   GET /api/cron/maintenance   Authorization: Bearer $CRON_SECRET
//
// Checks, in order:
//   1. Users inactive for >= 2 continuous days (alert once per day per user
//      is overkill — we send one daily digest listing them).
//   2. Users who signed up but never used the app (no expenses, no income,
//      no reports, lastActive still ~ createdAt).
//   3. Destructive account actions in the last 24h (deactivate / delete /
//      wipe) — AuditLog entries not already covered by instant emails.
//   4. MongoDB size % against DB_SIZE_LIMIT_MB (default 512MB free tier),
//      alert at >= 50% and >= 75% thresholds.
//   5. >= 5 API ERROR/CRITICAL SystemLog rows in the last hour.
//
// Also prunes SitePageView rows older than SITE_ANALYTICS_RETENTION_DAYS
// (default 180).
//
// All thresholds and dedupe state live in Settings so re-runs don't re-alert.

const HOUR_MS = 60 * 60 * 1000;

async function getSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.settings.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function setSetting(key: string, value: string): Promise<void> {
  try {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  } catch (err) {
    console.error(`[maintenance] Failed to persist setting ${key}:`, err);
  }
}

// Don't re-send the same digest more than once per window (ms).
async function shouldSend(key: string, windowMs: number): Promise<boolean> {
  const last = await getSetting(key);
  if (!last) return true;
  const ts = Date.parse(last);
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts >= windowMs;
}

async function markSent(key: string): Promise<void> {
  await setSetting(key, new Date().toISOString());
}

// ---- Check 1: users inactive for >= 2 continuous days ---------------------
async function inactiveUsersSection(): Promise<string[]> {
  const cutoff = subDays(new Date(), 2);
  const users = await prisma.user.findMany({
    where: {
      lastActive: { lte: cutoff },
      isSuspended: false,
      isAdmin: false,
    },
    select: { email: true, name: true, lastActive: true },
    orderBy: { lastActive: "asc" },
    take: 50,
  });

  return users.map(
    (u: { email: string; lastActive: Date | null }) =>
      `<strong>${u.email}</strong> — last seen ${
        u.lastActive ? format(u.lastActive, "MMM dd, yyyy") : "unknown"
      }`
  );
}

// ---- Check 2: signups that never used the app -----------------------------
async function dormantSignupsSection(): Promise<string[]> {
  // Created >= 2 days ago, still no transaction data, no recent activity.
  const cutoff = subDays(new Date(), 2);
  const candidates = await prisma.user.findMany({
    where: {
      createdAt: { lte: cutoff },
      isSuspended: false,
      isAdmin: false,
      expenses: { none: {} },
      incomes: { none: {} },
      reports: { none: {} },
    },
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return candidates.map(
    (u: { email: string; createdAt: Date | null }) =>
      `<strong>${u.email}</strong> — registered ${
        u.createdAt ? format(u.createdAt, "MMM dd, yyyy") : "unknown date"
      }, never used`
  );
}

// ---- Check 3: destructive actions in the last 24h -------------------------
async function destructiveActionsSection(): Promise<string[]> {
  const since = subDays(new Date(), 1);
  const entries = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: since },
      actionType: { in: ["USER_SUSPENDED", "USER_DELETED", "USER_LOCKED"] },
    },
    select: { actionType: true, target: true, adminName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return entries.map(
    (e: { actionType: string; target: string | null; adminName: string | null; createdAt: Date }) =>
      `${e.actionType} — <strong>${e.target}</strong> by ${e.adminName} at ${format(
        e.createdAt,
        "MMM dd, HH:mm"
      )}`
  );
}

// ---- Check 4: MongoDB size % ---------------------------------------------
async function dbSizeSection(): Promise<{ items: string[]; level: 0 | 50 | 75 }> {
  const limitMb = Number(process.env.DB_SIZE_LIMIT_MB || "512");
  if (!Number.isFinite(limitMb) || limitMb <= 0) return { items: [], level: 0 };

  let usedMb = 0;
  try {
    // dbStats dataSize is in bytes; scale to MB directly.
    const stats = await prisma.$runCommandRaw({ dbStats: 1, scale: 1048576 });
    usedMb = Number(stats?.dataSize ?? 0);
  } catch (err) {
    console.error("[maintenance] dbStats failed:", err);
    return { items: [], level: 0 };
  }

  const percent = Math.round((usedMb / limitMb) * 100);
  const level: 0 | 50 | 75 = percent >= 75 ? 75 : percent >= 50 ? 50 : 0;

  const items: string[] = [
    `Database size: <strong>${usedMb.toFixed(1)} MB</strong> of ${limitMb} MB (${percent}%)`,
  ];
  if (level === 75) {
    items.push(
      "<strong>Critical:</strong> above 75% — archive old data or raise the plan soon."
    );
  } else if (level === 50) {
    items.push("Above 50% — keep an eye on growth.");
  }

  return { items: level > 0 ? items : [], level };
}

// ---- Check 5: API failures this hour -------------------------------------
async function apiFailuresSection(): Promise<string[]> {
  const since = new Date(Date.now() - HOUR_MS);
  const failures = await prisma.systemLog.findMany({
    where: {
      level: { in: ["ERROR", "CRITICAL"] },
      service: "API",
      createdAt: { gte: since },
    },
    select: { message: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (failures.length < 5) return [];

  // Collapse repeated identical messages: "12× GET /api/expenses failed".
  const counts = new Map<string, number>();
  for (const f of failures) {
    counts.set(f.message, (counts.get(f.message) || 0) + 1);
  }
  const items = [...counts.entries()].map(
    ([message, count]) => `${count}× ${message}`
  );
  items.unshift(
    `<strong>${failures.length} API errors in the last hour</strong> (threshold: 5)`
  );
  return items;
}

// ---- Retention prune ------------------------------------------------------
async function pruneOldPageviews(): Promise<number> {
  const retentionDays = Number(process.env.SITE_ANALYTICS_RETENTION_DAYS || "180");
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return 0;
  try {
    const result = await prisma.sitePageView.deleteMany({
      where: { createdAt: { lt: subDays(new Date(), retentionDays) } },
    });
    return result?.count ?? 0;
  } catch (err) {
    console.error("[maintenance] pageview prune failed:", err);
    return 0;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const summary: Record<string, unknown> = {};
  const sent: string[] = [];

  try {
    // --- Report A: daily user-lifecycle digest (once per day) ---
    if (await shouldSend("maintenance:lifecycle:lastSent", 20 * HOUR_MS)) {
      const [inactive, dormant, destructive] = await Promise.all([
        inactiveUsersSection(),
        dormantSignupsSection(),
        destructiveActionsSection(),
      ]);

      if (inactive.length || dormant.length || destructive.length) {
        const result = await sendAdminMaintenanceReport(
          "SpendWise Maintenance: user lifecycle report",
          "Daily digest from the hourly maintenance worker.",
          [
            { heading: `Inactive >= 2 days (${inactive.length})`, items: inactive },
            { heading: `Registered but never used (${dormant.length})`, items: dormant },
            { heading: "Destructive actions (last 24h)", items: destructive },
          ]
        );
        if (result.success) {
          await markSent("maintenance:lifecycle:lastSent");
          sent.push("lifecycle");
        }
      } else {
        // Nothing to report — still mark sent so we don't re-query all day.
        await markSent("maintenance:lifecycle:lastSent");
      }
      summary.lifecycle = { inactive: inactive.length, dormant: dormant.length };
    }

    // --- Report B: API failure spike (>= 5/hour, at most once per hour) ---
    const apiItems = await apiFailuresSection();
    if (apiItems.length && (await shouldSend("maintenance:apiFailures:lastSent", HOUR_MS))) {
      const result = await sendAdminMaintenanceReport(
        "SpendWise Alert: API error spike",
        "The hourly maintenance worker detected repeated API failures.",
        [{ heading: "API errors", items: apiItems }]
      );
      if (result.success) {
        await markSent("maintenance:apiFailures:lastSent");
        sent.push("apiFailures");
      }
    }

    // --- Report C: DB size thresholds (50% / 75%, once per level per day) ---
    const db = await dbSizeSection();
    if (db.level > 0) {
      const key = `maintenance:dbSize:lastSent:${db.level}`;
      if (await shouldSend(key, 20 * HOUR_MS)) {
        const result = await sendAdminMaintenanceReport(
          `SpendWise Alert: database size ${db.level}% threshold reached`,
          "The hourly maintenance worker checked MongoDB storage usage.",
          [{ heading: "Storage", items: db.items }]
        );
        if (result.success) {
          await markSent(key);
          sent.push(`dbSize:${db.level}`);
        }
      }
    }
    summary.dbLevel = db.level;

    // --- Housekeeping: prune old anonymous pageviews ---
    const pruned = await pruneOldPageviews();
    summary.prunedPageviews = pruned;

    // Audit trail for the run itself (INFO, non-spammy: one row per run).
    await logger.info("Maintenance worker completed", { ...summary, sent }, "WORKER");

    return NextResponse.json({ success: true, ...summary, sent });
  } catch (error) {
    console.error("Maintenance worker failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
