import { Queue, Worker } from "bullmq";
import { sendEmail } from "./mail";
import { prisma } from "./prisma";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URI || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null
});

export const emailQueue = new Queue("emailQueue", { connection });

// Initialize the worker only if we are in an environment that can run long-running processes
// Next.js API routes are typically serverless, but if running a custom server or long-running process, this works.
// Alternatively, this worker can be started in a separate node process.
const worker = new Worker("emailQueue", async (job) => {
  const { userId, userEmail, userName, subject, body, notificationId } = job.data;

  try {
    const personalizedBody = body.replace(/{userName}/g, userName || "User");
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        ${personalizedBody.replace(/\n/g, '<br/>')}
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;"/>
        <p style="font-size: 12px; color: #999;">
          You received this because you are a registered SpendWise user.
          <br/>
          To stop receiving these emails, please unsubscribe in your settings.
        </p>
      </div>
    `;

    const result = await sendEmail(userEmail, subject, html);
    
    // You could update a specific delivery status here if you had a model for it.
    console.log(`Email job completed for ${userEmail}`);
    return result;
  } catch (error) {
    console.error(`Failed to process email job for ${userEmail}:`, error);
    throw error;
  }
}, { connection });

worker.on("failed", (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error ${err.message}`);
  }
});
