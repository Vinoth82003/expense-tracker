import {
  callGroqNLU,
  isGroqChatEnabled,
  type GroqNLUResult,
} from "@/lib/chat/groq";
import { logAiUsage } from "@/lib/chat/ai/usage";
import { sanitizePii } from "@/lib/pii";
import { isCrossUserDataRequest } from "@/lib/chat/v2/engine";
import { fetchCategories } from "@/lib/chat/v1/api-gateway";
import type { AIEntityResult, AIIntentResult, AIIntentType } from "./types";

// V4 NLU fallback bridge.
// Fires ONLY when the local rule engine landed on "unknown" / low confidence
// (<0.35) AND there is no active V2 session. Groq classifies, the result is
// validated against a strict output contract, and the caller re-enters the
// engine via body.ai — so the rule engine stays authoritative for parsing.

const NLU_TRIGGER_CONFIDENCE = 0.35;

const NLU_INTENTS = new Set<string>([
  "add_expense",
  "add_income",
  "update_budget",
  "query_expense",
  "query_income",
  "query_savings",
  "query_category",
  "query_comparison",
  "create_category",
  "greeting",
  "free_form_question",
  "unknown",
]);

const NLU_OUTPUT_SHAPE = `{"intent": "...", "confidence": 0.0, "entities": {"amount": null, "amountRaw": null, "note": null, "date_phrase": null, "category_hint": null, "income_category_hint": null}}`;
const NLU_INTENTS_HINT =
  "[add_expense, add_income, update_budget, query_expense, query_income, query_savings, query_category, query_comparison, create_category, greeting, free_form_question, unknown]";

export type GroqNLUConversationTurn = { role?: string; content?: string };

export type GroqNLUContext = {
  userId?: string;
  request?: Request;
  v2?: { session?: unknown };
  conversation?: GroqNLUConversationTurn[];
};

function truncate(value: string, maxLength: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean;
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function isGroqNLUShadow(): boolean {
  return isTruthyEnv(process.env.GROQ_NLU_SHADOW);
}

export function buildSystemPromptForNLU(categoryList: string, lastTurns: string): string {
  return `You are the understanding layer for Sage, a financial assistant inside SpendWise.
A message did not match any known pattern. Classify it and extract any entities.

Rules:
- Output ONLY valid JSON matching the given schema. No prose, no markdown fences.
- Never invent an amount, date, or category not implied by the message text.
- If the message is a financial question that doesn't fit any fixed category,
  use intent "free_form_question".
- If you are not confident, use intent "unknown" with a low confidence score —
  do not guess to force a match.
- The user's real category list is provided below; only use category_hint
  values from this list, or leave it null.

User's categories: ${categoryList}
Recent conversation: ${lastTurns}`;
}

export function buildLastTurns(
  conversation?: GroqNLUConversationTurn[],
  maxTurns = 6,
): string {
  if (!conversation || !Array.isArray(conversation)) return "(none)";
  const turns = conversation
    .filter((turn) => turn && typeof turn.content === "string")
    .slice(-maxTurns)
    .map((turn) => {
      const role = turn.role === "assistant" ? "assistant" : "user";
      return `${role}: ${truncate(sanitizePii(turn.content || ""), 160)}`;
    });
  return turns.length ? turns.join("\n") : "(none)";
}

function parseAmount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[₹,\s]/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

export function parseGroqNLUOutput(
  data: unknown,
): { intent: string; confidence: number; entities: AIEntityResult } | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const intent = obj.intent;
  if (typeof intent !== "string" || !NLU_INTENTS.has(intent)) return null;

  const rawConfidence = obj.confidence;
  const confidence =
    typeof rawConfidence === "number" && Number.isFinite(rawConfidence)
      ? Math.min(1, Math.max(0, rawConfidence))
      : 0.6;

  const entities: AIEntityResult = {};
  const rawEntities = obj.entities;
  if (rawEntities && typeof rawEntities === "object") {
    const e = rawEntities as Record<string, unknown>;
    const amount = parseAmount(e.amount);
    if (amount !== undefined) entities.amount = amount;
    if (typeof e.amountRaw === "string") entities.amountRaw = truncate(sanitizePii(e.amountRaw), 40);
    if (typeof e.note === "string") entities.note = truncate(sanitizePii(e.note), 80);
    if (typeof e.date_phrase === "string") entities.date = truncate(sanitizePii(e.date_phrase), 40);
    if (typeof e.category_hint === "string" && e.category_hint.trim()) {
      entities.categoryCandidate = truncate(sanitizePii(e.category_hint), 40);
      entities.categoryConfidence = confidence;
    }
    if (typeof e.income_category_hint === "string" && e.income_category_hint.trim()) {
      entities.incomeCategory = truncate(sanitizePii(e.income_category_hint), 40);
    }
  }

  return { intent, confidence, entities };
}

async function getUserCategoriesLabel(request?: Request): Promise<string> {
  try {
    if (!request) return "(none)";
    const response = await fetchCategories({ req: request });
    const categories = (response?.categories || []) as Array<{
      name?: string;
      type?: string;
    }>;
    const list = categories
      .map((c) => {
        const name = sanitizePii(c.name || "").trim();
        if (!name) return "";
        return c.type ? `${name} (${sanitizePii(c.type)})` : name;
      })
      .filter(Boolean);
    return list.length ? list.join(", ") : "(none)";
  } catch {
    return "(none)";
  }
}

export async function maybeGroqNLU(
  message: string,
  localResult: AIIntentResult | null,
  context: GroqNLUContext = {},
): Promise<AIIntentResult | null> {
  if (!message || !localResult) return null;
  if (!isGroqChatEnabled()) return null;

  const lowConfidence =
    typeof localResult.confidence === "number" &&
    localResult.confidence < NLU_TRIGGER_CONFIDENCE;
  if (localResult.intent !== "unknown" && !lowConfidence) return null;

  // V2 session is active → V2 rules own the flow; never re-classify mid-session.
  if (context.v2?.session) return null;

  // Cross-user / prompt-injection guard runs BEFORE any external call.
  if (isCrossUserDataRequest(message)) return null;

  const categoryList = await getUserCategoriesLabel(context.request);
  const lastTurns = buildLastTurns(context.conversation);
  const system = buildSystemPromptForNLU(categoryList, lastTurns);
  const user = `Message: ${message}

Output this exact JSON shape: ${NLU_OUTPUT_SHAPE}
intent must be one of: ${NLU_INTENTS_HINT}`;

  const startedAt = Date.now();

  let result: GroqNLUResult;
  try {
    result = await callGroqNLU([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
  } catch {
    const latencyMs = Date.now() - startedAt;
    if (context.userId) {
      logAiUsage({
        userId: context.userId,
        callType: "nlu",
        intent: null,
        latencyMs,
        fallbackUsed: true,
      });
    }
    return null;
  }

  const latencyMs = Date.now() - startedAt;
  const parsed = parseGroqNLUOutput(result.data);

  if (!parsed) {
    if (context.userId) {
      logAiUsage({
        userId: context.userId,
        callType: "nlu",
        intent: null,
        promptTokens: result.usage.promptTokens,
        outputTokens: result.usage.outputTokens,
        latencyMs,
        fallbackUsed: true,
      });
    }
    return null;
  }

  if (context.userId) {
    logAiUsage({
      userId: context.userId,
      callType: "nlu",
      intent: parsed.intent,
      promptTokens: result.usage.promptTokens,
      outputTokens: result.usage.outputTokens,
      latencyMs,
      fallbackUsed: false,
    });
  }

  // Classified but no V4 handler yet → act exactly as V3 would (P4 scope).
  if (parsed.intent === "unknown") {
    return null;
  }

  // Shadow mode: record what Groq would have done, but still act as V3.
  if (isGroqNLUShadow()) return null;

  return {
    intent: parsed.intent as AIIntentType,
    confidence: parsed.confidence,
    entities: parsed.entities,
  };
}
