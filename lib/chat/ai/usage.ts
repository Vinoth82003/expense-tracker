import { prisma } from "@/lib/prisma";

// V4 AI cost/usage telemetry — fire-and-forget writes to AiUsageLog.
// Never throws: logging failures must not affect the chat request path.

const COST_PER_1K_PROMPT = Number(process.env.GROQ_COST_PER_1K_PROMPT || 0.00059);
const COST_PER_1K_COMPLETION = Number(process.env.GROQ_COST_PER_1K_COMPLETION || 0.00079);

export type AiUsageInput = {
  userId: string;
  callType: "nlu" | "nlg" | "analyze";
  intent?: string | null;
  promptTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  fallbackUsed?: boolean;
};

export function estimateCostUsd(promptTokens: number, outputTokens: number): number {
  const prompt = Number.isFinite(promptTokens) && promptTokens > 0 ? promptTokens : 0;
  const output = Number.isFinite(outputTokens) && outputTokens > 0 ? outputTokens : 0;
  return (
    (prompt / 1000) * COST_PER_1K_PROMPT +
    (output / 1000) * COST_PER_1K_COMPLETION
  );
}

export function logAiUsage(input: AiUsageInput): void {
  const { userId, callType, intent, promptTokens, outputTokens, latencyMs, fallbackUsed } = input;
  const costUsd = estimateCostUsd(promptTokens || 0, outputTokens || 0);

  prisma.aiUsageLog
    .create({
      data: {
        userId,
        callType,
        intent: intent || null,
        promptTokens: promptTokens || null,
        outputTokens: outputTokens || null,
        costUsd,
        latencyMs: latencyMs || null,
        fallbackUsed: !!fallbackUsed,
      },
    })
    .catch(() => {});
}
