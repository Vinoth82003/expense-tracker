import { verifyAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { maskEmail } from "@/lib/admin/sessions-filter";

// Show a display name when we have one, otherwise a masked email — never the
// raw address (spec 01: reduce personal data in the activity feed).
function actorLabel(name?: string | null, email?: string | null): string {
  if (name && name.trim()) return name.trim();
  if (email && email.trim()) return maskEmail(email.trim());
  return "a user";
}

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch different types of activities
    const [users, reports, budgets] = await Promise.all([
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true }
      }),
      prisma.report.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.budget.findMany({
        take: 5,
        orderBy: { id: 'desc' }, // Assuming higher ID is newer for MongoDB ObjectId
        include: { user: { select: { name: true, email: true } } }
      })
    ]);

    // Map to a common activity format
    const activities = [
      ...users.map(u => ({
        type: "signup",
        userId: u.id,
        description: `${actorLabel(u.name, u.email)} signed up`,
        timestamp: u.createdAt,
        color: "teal"
      })),
      ...reports.map(r => ({
        type: "report",
        userId: r.userId,
        description: `${actorLabel(r.user?.name, r.user?.email)} generated an AI report`,
        timestamp: r.date,
        color: "blue"
      })),
      ...budgets.map(b => ({
        type: "budget",
        userId: b.userId,
        description: `${actorLabel(b.user?.name, b.user?.email)} updated their monthly budget`,
        timestamp: new Date(parseInt(b.id.substring(0,8), 16) * 1000), // Infer date from MongoDB ObjectId
        color: "amber"
      }))
    ];

    // Sort by timestamp desc and take 20
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp as Date).getTime() - new Date(a.timestamp as Date).getTime())
      .slice(0, 20);

    return NextResponse.json(sortedActivities);

  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json({ message: "Failed to fetch activity" }, { status: 500 });
  }
}

