import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { emailQueue } from "@/lib/queue";
import { subDays } from "date-fns";
import { logger } from "@/lib/logger";

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "true";
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, body, recipientFilter } = await req.json();
    
    await logger.info("API", `Starting mass notification send: ${subject}`, { recipientFilter });

    if (!subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch unsubscribed emails
    const unsubscribed = await (prisma as any).unsubscribe.findMany({
      select: { email: true }
    });
    const unsubscribedEmails = unsubscribed.map((u: any) => u.email);

    // 2. Build where clause
    const where: any = {
      email: { notIn: unsubscribedEmails }
    };

    if (recipientFilter) {
      const { 
        twoFactorEnabled, limitMode, active30d, newUsers, 
        incomeNoExpenses, noIncomeNoExpenses,
        inactive2d, inactive7d, specificEmail 
      } = recipientFilter;

      if (twoFactorEnabled) where.twoFactorEnabled = true;
      if (limitMode) where.expenseMode = "limit";
      if (active30d) where.lastActive = { gte: subDays(new Date(), 30) };
      if (newUsers) where.createdAt = { gte: subDays(new Date(), 7) };
      
      if (incomeNoExpenses) {
        where.incomes = { some: {} };
        where.expenses = { none: {} };
      }
      
      if (noIncomeNoExpenses) {
        where.incomes = { none: {} };
        where.expenses = { none: {} };
      }

      if (inactive2d) {
        where.lastActive = { lte: subDays(new Date(), 2) };
      }

      if (inactive7d) {
        where.lastActive = { lte: subDays(new Date(), 7) };
      }

      if (recipientFilter.onboarded === false) {
        where.onboarded = false;
      }

      if (recipientFilter.noPWA === true) {
        where.isPWAInstalled = false;
      }

      if (specificEmail) where.email = specificEmail;
    }

    // 3. Fetch recipients
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // 4. Create notification record
    const notification = await (prisma as any).notification.create({
      data: {
        subject,
        body,
        recipientCount: users.length,
        recipientFilter: JSON.stringify(recipientFilter || {}),
        status: "PROCESSING",
        adminName: "Admin"
      }
    });

    // 5. Enqueue jobs with validation
    const jobs = users.map(user => {
      if (!user.email || !user.id) {
        throw new Error(`Invalid user data for user ${user.id || 'unknown'}`);
      }
      return {
        name: 'send-email',
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name || "User",
          subject,
          body,
          notificationId: notification.id
        }
      };
    });

    // Add jobs
    const enqueuedJobs = await Promise.all(
      jobs.map(job => emailQueue.add(job.name, job.data))
    );

    console.log(`[Send] Enqueued ${enqueuedJobs.length} jobs. IDs: ${enqueuedJobs.map(j => j.id).join(', ')}`);

    // 6. Wait for all jobs to complete using polling (most reliable in dev/hot-reload)
    async function waitForJobCompletion(job: any, timeout = 120000) {
      const startTime = Date.now();
      let lastLogTime = startTime;

      while (Date.now() - startTime < timeout) {
        const state = await job.getState();
        
        // Log every 10 seconds if still waiting
        if (Date.now() - lastLogTime > 10000) {
          console.log(`[Send] Still waiting for job ${job.id}. Current state: ${state}`);
          lastLogTime = Date.now();
        }

        if (state === 'completed') return { success: true };
        if (state === 'failed') {
          const reason = await job.getFailedReason();
          return { success: false, error: reason };
        }
        // Poll every 200ms
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const finalState = await job.getState();
      throw new Error(`Job ${job.id} timed out after ${timeout}ms (Final state: ${finalState})`);
    }

    try {
      console.log(`[Send] Waiting for ${enqueuedJobs.length} jobs to finish...`);
      const results = await Promise.all(
        enqueuedJobs.map(job => waitForJobCompletion(job))
      );

      const failedJobs = results.filter(r => !r.success);
      if (failedJobs.length > 0) {
        throw new Error(`${failedJobs.length} jobs failed to complete successfully.`);
      }

      console.log(`[Send] All ${enqueuedJobs.length} jobs have finished.`);

      // Update status to SUCCESS (initial dispatch complete)
      await (prisma as any).notification.update({
        where: { id: notification.id },
        data: { status: "SUCCESS" }
      });

      return NextResponse.json({
        success: true,
        notificationId: notification.id,
        count: users.length
      });

    } catch (jobErr: any) {
      await logger.error("API", `Error during mass notification send`, { error: jobErr.message, subject });
      
      // Update notification status to FAILED
      await (prisma as any).notification.update({
        where: { id: notification.id },
        data: { 
          status: "FAILED",
          error: jobErr.message
        }
      }).catch((err:any) => console.error("[Send] Failed to update notification error status:", err));
      
      return NextResponse.json(
        { error: "Jobs failed to complete: " + jobErr.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("[Send-API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const notification = await (prisma as any).notification.findUnique({
      where: { id },
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}