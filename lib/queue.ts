import { Queue, Worker } from "bullmq";
import { sendEmail, replaceVariables, wrapLayout } from "./mail";
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
  const { userId, userEmail, userName, subject, body, notificationId, ...extra } = job.data;

  try {
    const variables = {
      userName: userName || "User",
      date: extra.date || new Date().toLocaleDateString(),
      amount: extra.amount || "0",
      limit: extra.limit || "0",
      code: extra.code || "",
      ...extra
    };

    const personalizedSubject = replaceVariables(subject, variables);
    const personalizedBody = replaceVariables(body, variables);
    
    const contentHtml = `
      ${personalizedBody.replace(/\n/g, '<br/>')}
    `;

    const html = wrapLayout(contentHtml);

    const result = await sendEmail(userEmail, personalizedSubject, html);
    
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
