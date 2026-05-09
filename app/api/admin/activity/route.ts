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
        description: `${u.name || u.email} signed up`,
        timestamp: u.createdAt,
        color: "teal"
      })),
      ...reports.map(r => ({
        type: "report",
        userId: r.userId,
        description: `${r.user?.name || r.user?.email} generated an AI report`,
        timestamp: r.date,
        color: "blue"
      })),
      ...budgets.map(b => ({
        type: "budget",
        userId: b.userId,
        description: `${b.user?.name || b.user?.email} updated their monthly budget to ₹${b.amount}`,
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

