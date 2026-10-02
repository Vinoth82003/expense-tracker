import { prisma } from "@/lib/prisma";

/**
 * Central gate for AI-backed endpoints.
 *
 * Every AI route must call `checkAiAccess` before touching an external model so
 * that the admin kill-switch is honoured in one place. Feature state lives in
 * the `featureFlags` Settings row (JSON blob) and quota/config in `aiSettings`,
 * both managed from /admin/settings.
 */

export type AiFeature = "chat" | "analyze" | "categorize";

/**
 * Mirrors `defaultFeatureFlags` in app/api/admin/settings/route.ts. Stored flags
 * are merged over these, so a row written before a flag existed resolves to the
 * default (enabled) rather than silently disabling the feature.
 */
export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  aiAnalysis: true,
  chatAssistant: true,
  pdfExport: true,
  twoFactorAuth: true,
  pwaPrompt: true,
  budgetAlerts: true,
  customSubcategories: true,
};

const FEATURE_FLAG_BY_AI_FEATURE: Record<AiFeature, string> = {
  chat: "chatAssistant",
  analyze: "aiAnalysis",
  categorize: "smartCategorization",
};

export type AiAccessResult =
  | { allowed: true }
  | { allowed: false; status: 403 | 429; error: string };

type SettingsRow = { key: string; value: string };

/**
 * Narrow view of the two models this gate touches. The generated Prisma client
 * is cast throughout the codebase (the client types lag the schema), but this
 * keeps the cast in one place instead of at every call site.
 */
const db = prisma as unknown as {
  settings: {
    findMany: (args: {
      where: { key: { in: string[] } };
    }) => Promise<SettingsRow[]>;
  };
  aiUsageLog: {
    count: (args: {
      where: { userId: string; createdAt: { gte: Date } };
    }) => Promise<number>;
  };
};

async function loadSettings(): Promise<{
  featureFlags: Record<string, boolean>;
  aiSettings: Record<string, number>;
}> {
  const rows = await db.settings.findMany({
    where: { key: { in: ["featureFlags", "aiSettings"] } },
  });

  const parsed = new Map<string, Record<string, unknown>>();
  for (const row of rows ?? []) {
    try {
      parsed.set(row.key, JSON.parse(row.value));
    } catch {
      parsed.set(row.key, {});
    }
  }

  const storedFlags = parsed.get("featureFlags") ?? {};
  const storedAi = parsed.get("aiSettings") ?? {};

  return {
    featureFlags: {
      ...DEFAULT_FEATURE_FLAGS,
      ...storedFlags,
    } as Record<string, boolean>,
    aiSettings: storedAi as Record<string, number>,
  };
}

/** Feature flags merged over defaults. Missing keys resolve to enabled. */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  const { featureFlags } = await loadSettings();
  return featureFlags;
}

/**
 * Checks whether `userId` may use `feature`.
 *
 * Denies when the matching feature flag is off. For `chat` it also enforces the
 * per-day AI call cap in `aiSettings.maxChatCalls` (absent or <= 0 = unlimited).
 * Analyze keeps its own Report-row quota, which counts generations accurately.
 */
export async function checkAiAccess(
  userId: string,
  feature: AiFeature,
): Promise<AiAccessResult> {
  const { featureFlags, aiSettings } = await loadSettings();

  const flagKey = FEATURE_FLAG_BY_AI_FEATURE[feature];
  if (featureFlags[flagKey] === false) {
    const errorMsg =
      feature === "chat"
        ? "Sage AI is temporarily unavailable. We are upgrading Sage AI for better performance and will be back soon."
        : feature === "analyze"
          ? "AI Forensic Analysis is temporarily unavailable. We are upgrading our AI services for better performance."
          : "Smart Categorization is temporarily unavailable.";
    return {
      allowed: false,
      status: 403,
      error: errorMsg,
    };
  }

  if (feature === "chat") {
    const maxCalls = Number(aiSettings.maxChatCalls) || 0;
    if (maxCalls > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const used = await db.aiUsageLog.count({
        where: { userId, createdAt: { gte: startOfDay } },
      });

      if (used >= maxCalls) {
        return {
          allowed: false,
          status: 429,
          error: `Daily AI limit reached. You can run ${maxCalls} AI request${
            maxCalls === 1 ? "" : "s"
          } per day.`,
        };
      }
    }
  }

  return { allowed: true };
}