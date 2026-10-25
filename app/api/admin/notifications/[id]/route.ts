import { verifyAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { describeNotificationStatus } from "@/lib/email-jobs";
import {
  buildRecipientWhere,
  getUnsubscribedEmails,
  type RecipientFilter,
} from "@/lib/admin/notification-recipients";

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Reconstruct the audience with the SAME resolver the composer preview and
    // the send path use, so the detail view cannot disagree with either.
    let recipients: { name: string | null; email: string }[] = [];
    try {
      const parsedFilter: RecipientFilter | null = notification.recipientFilter
        ? (JSON.parse(notification.recipientFilter) as RecipientFilter)
        : null;
      const unsubscribedEmails = await getUnsubscribedEmails();
      const where = buildRecipientWhere(parsedFilter, unsubscribedEmails);
      recipients = await prisma.user.findMany({
        where,
        select: { name: true, email: true },
      });
    } catch (e) {
      console.error("Failed to reconstruct notification recipients", e);
    }

    // Per-recipient open/click tracking, one EmailLog row per campaign+recipient.
    let engagement: {
      sent: number;
      opened: number;
      clicked: number;
      recipients: {
        email: string;
        name: string | null;
        opened: boolean;
        openedAt: string | null;
        clicked: boolean;
        clickedAt: string | null;
      }[];
    } | null = null;

    try {
      const logs = await prisma.emailLog.findMany({
        where: { campaignId: id },
        orderBy: { sentAt: "asc" },
        select: {
          email: true,
          userId: true,
          opened: true,
          openedAt: true,
          clicked: true,
          clickedAt: true,
        },
      });

      if (logs.length > 0) {
        const userIds = [
          ...new Set(logs.map((l) => l.userId).filter((v): v is string => Boolean(v))),
        ];
        const users =
          userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true },
              })
            : [];
        const nameById = new Map(users.map((u) => [u.id, u.name]));

        engagement = {
          sent: logs.length,
          opened: logs.filter((l) => l.opened).length,
          clicked: logs.filter((l) => l.clicked).length,
          recipients: logs.map((l) => ({
            email: l.email,
            name: l.userId ? nameById.get(l.userId) ?? null : null,
            opened: l.opened,
            openedAt: l.openedAt?.toISOString?.() ?? null,
            clicked: l.clicked,
            clickedAt: l.clickedAt?.toISOString?.() ?? null,
          })),
        };
      }
    } catch (e) {
      console.error("Failed to load campaign engagement", e);
    }

    const lifecycle = describeNotificationStatus(notification.status, {
      deliveryConfirmed: notification.deliveryConfirmed ?? false,
      attempts: notification.attempts ?? 1,
    });

    return NextResponse.json({
      notification: {
        ...notification,
        correlationId: notification.correlationId ?? notification.id,
        attempts: notification.attempts ?? 1,
        deliveredCount: notification.deliveredCount ?? null,
        failedCount: notification.failedCount ?? null,
        deliveryConfirmed: notification.deliveryConfirmed ?? false,
        lifecycle: lifecycle.key,
        lifecycleLabel: lifecycle.label,
        lifecycleTone: lifecycle.tone,
        lifecycleDescription: lifecycle.description,
      },
      recipients,
      engagement,
    });
  } catch (error) {
    console.error("Failed to fetch notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
