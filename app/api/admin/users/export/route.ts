import { verifyAdminSession } from "@/lib/admin-auth";
import { getAdminInfo, logAudit } from "@/lib/admin/audit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { parseUserListQuery, buildUsersWhere } from "@/lib/admin/users-filter";
import { toCsv } from "@/lib/admin/csv";

const MAX_EXPORT_ROWS = 5000;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Server-side user export. Applies the SAME filters as the list endpoint (so the
 * file matches what the admin is looking at), enforces auth, caps the row count,
 * and is written to the audit trail. Formula-safe via lib/admin/csv.
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req);

  if (!(await verifyAdminSession())) {
    logger.warn("Unauthorized user export attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = parseUserListQuery(searchParams);
    const where = buildUsersWhere(query);

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          name: true,
          email: true,
          expenseMode: true,
          twoFactorEnabled: true,
          isSuspended: true,
          createdAt: true,
          lastActive: true,
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        take: MAX_EXPORT_ROWS,
      }),
    ]);

    const rows = users.map((user) => [
      user.name ?? "",
      user.email,
      user.expenseMode === "limit" ? "Limit" : user.expenseMode === "no-limit" ? "No-limit" : "Unknown",
      user.twoFactorEnabled === true ? "On" : user.twoFactorEnabled === false ? "Off" : "Unknown",
      user.isSuspended ? "Suspended" : "Active",
      user.createdAt ? user.createdAt.toISOString() : "",
      user.lastActive ? user.lastActive.toISOString() : "",
    ]);

    const csv = toCsv(
      ["Name", "Email", "Expense Mode", "2FA", "Status", "Joined", "Last Active"],
      rows
    );

    const admin = await getAdminInfo();
    await logAudit({
      adminName: admin?.adminName,
      adminId: admin?.adminId,
      actionType: "USER_DATA_EXPORTED",
      target: `${rows.length} user(s)`,
      details: `Exported ${rows.length} of ${total} user(s) matching filters: ${JSON.stringify({
        search: query.search || undefined,
        twoFA: query.twoFA || undefined,
        mode: query.mode || undefined,
        joined: query.joined || undefined,
      })}`,
      ip,
    });

    const truncated = total > rows.length;
    const filename = `users_export_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Rows": String(rows.length),
        "X-Export-Total": String(total),
        "X-Export-Truncated": truncated ? "true" : "false",
      },
    });
  } catch (error) {
    logger.error("Failed to export users", { error });
    return NextResponse.json({ error: "Failed to export users" }, { status: 500 });
  }
}
