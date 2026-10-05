/**
 * Inspects the real `emailQueue`: how many jobs are stuck, in what state, and how
 * long they have been sitting there. Stuck jobs hold the single concurrency slot,
 * so one hung send blocks a whole campaign — and stale jobs from a crashed run
 * silently poison the next test.
 *
 * Read-only. Pass --clean to also remove stuck non-terminal jobs.
 *
 *   node --env-file=.env scripts/queue-state.mjs [--clean]
 */
import IORedis from "ioredis";
import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URI || process.env.REDIS_URL;
const clean = process.argv.includes("--clean");

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue("emailQueue", { connection });

const counts = await queue.getJobCounts();
console.log("  job counts:", JSON.stringify(counts));

const all = await queue.getJobs(
  ["waiting", "active", "delayed", "failed", "completed", "paused", "wait"],
  0,
  199
);

const now = Date.now();
const rows = all
  .map((j) => ({
    id: j.id,
    state: null,
    attemptsMade: j.attemptsMade,
    age: Math.round((now - (j.timestamp ?? now)) / 1000),
    failedReason: j.failedReason,
  }))
  .sort((a, b) => (b.age ?? 0) - (a.age ?? 0));

for (const j of all) j.state = await j.getState();

const stuck = all.filter((j) => ["active", "waiting", "delayed", "wait"].includes(j.state));
console.log(`\n  non-terminal jobs: ${stuck.length}`);
for (const j of stuck.slice(0, 25)) {
  const meta = rows.find((r) => r.id === j.id);
  console.log(
    `   #${j.id}  ${String(j.state).padEnd(8)} age=${String(meta?.age).padStart(6)}s ` +
      `attempts=${meta?.attemptsMade}  ${j.failedReason ?? ""}`
  );
}

if (stuck.length) {
  const oldest = Math.max(...stuck.map((j) => now - (j.timestamp ?? now)));
  console.log(`\n  oldest stuck job: ${Math.round(oldest / 1000)}s`);
}

if (clean && stuck.length) {
  // These hold the worker's only concurrency slot and can never complete.
  await queue.remove(...stuck.map((j) => j.id));
  console.log(`  removed ${stuck.length} stuck job(s)`);
}

await queue.close();
await connection.quit();
process.exit(0);
