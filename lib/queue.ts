import { Queue, Worker, QueueEvents, Job } from "bullmq";
import { sendEmail, replaceVariables, wrapLayout } from "./mail";
import { prisma } from "./prisma";
import IORedis from "ioredis";

/**
 * REDIS CONFIGURATION
 */
const REDIS_CONFIG = {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
};

const getRedisUrl = () => process.env.REDIS_URI || "redis://127.0.0.1:6379";

/**
 * SINGLETON CONNECTIONS
 */
const globalForRedis = global as unknown as {
  redisQueue: IORedis;
  redisWorker: IORedis;
  redisEvents: IORedis;
};

const getQueueConn = () => {
  if (!globalForRedis.redisQueue) globalForRedis.redisQueue = new IORedis(getRedisUrl(), REDIS_CONFIG);
  return globalForRedis.redisQueue;
};

const getWorkerConn = () => {
  if (!globalForRedis.redisWorker) globalForRedis.redisWorker = new IORedis(getRedisUrl(), REDIS_CONFIG);
  return globalForRedis.redisWorker;
};

const getEventsConn = () => {
  if (!globalForRedis.redisEvents) globalForRedis.redisEvents = new IORedis(getRedisUrl(), REDIS_CONFIG);
  return globalForRedis.redisEvents;
};

/**
 * SINGLETON BULLMQ INSTANCES
 */
const globalForBull = global as unknown as {
  emailQueue: Queue;
  emailWorker: Worker;
  emailEvents: QueueEvents;
};

// Queue Setup
export const emailQueue = globalForBull.emailQueue || new Queue("emailQueue", { 
  connection: getQueueConn(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  }
});

if (process.env.NODE_ENV !== "production") globalForBull.emailQueue = emailQueue;

// Events Setup
if (!globalForBull.emailEvents) {
  globalForBull.emailEvents = new QueueEvents("emailQueue", { connection: getEventsConn() });
  
  globalForBull.emailEvents.on('waiting', ({ jobId }) => console.log(`[Queue] Job ${jobId} is waiting`));
  globalForBull.emailEvents.on('active', ({ jobId }) => console.log(`[Queue] Job ${jobId} is active`));
  globalForBull.emailEvents.on('completed', ({ jobId }) => console.log(`[Queue] Job ${jobId} completed`));
  globalForBull.emailEvents.on('failed', ({ jobId, failedReason }) => console.error(`[Queue] Job ${jobId} failed: ${failedReason}`));
}

export const emailEvents = globalForBull.emailEvents;

/**
 * WORKER PROCESSOR
 */
async function jobProcessor(job: Job) {
  console.log(`[Worker] Job ${job.id} picked up for processing`);
  const { userEmail, userName, subject, body, notificationId, ...extra } = job.data;
  console.log(`[Worker] Processing ${job.id} for ${userEmail}`);

  try {
    const variables = { 
      userName: userName || "User", 
      date: extra.date || new Date().toLocaleDateString(), 
      ...extra 
    };

    const personalizedSubject = replaceVariables(subject, variables);
    const contentHtml = replaceVariables(body, variables).replace(/\n/g, '<br/>');
    const html = wrapLayout(contentHtml, userEmail);

    const result = await sendEmail(userEmail, personalizedSubject, html);
    
    if (!result.success) throw new Error(`SMTP Error: ${result.error}`);

    // Update notification record if it exists
    if (notificationId) {
      try {
        await (prisma as any).notification.update({
          where: { id: notificationId },
          data: {
            status: "SUCCESS" // This might need more complex logic for mass emails
          }
        }).catch(() => {}); // Ignore errors if record not found
      } catch (e) {}
    }

    console.log(`[Worker] Job ${job.id} finished`);
    return result;
  } catch (error) {
    console.error(`[Worker] Job ${job.id} error:`, error);
    throw error;
  }
}

// Worker Setup
if (!globalForBull.emailWorker) {
  globalForBull.emailWorker = new Worker("emailQueue", jobProcessor, { 
    connection: getWorkerConn(),
    concurrency: 5,
  });

  globalForBull.emailWorker.on("failed", (job, err) => {
    if (job) console.error(`[Worker] Job ${job.id} definitively failed: ${err.message}`);
  });
}

export const emailWorker = globalForBull.emailWorker;

/**
 * UTILS
 */
export const logger = {
  info: (msg: any, data?: any) => console.log(msg, data || ''),
  error: (msg: any, data?: any) => console.error(msg, data || ''),
  warn: (msg: any, data?: any) => console.warn(msg, data || ''),
  debug: (msg: any, data?: any) => console.log(msg, data || ''),
};