import { classifyIntent } from "./intent";
import { classifyCategory } from "./classifier";
import type { AIIntentResult, AIClassificationResult } from "./types";

type ChatCategory = {
  id: string;
  name: string;
  type: "Needs" | "Wants";
  isDefault?: boolean;
  userId?: string | null;
};

export type AIAnalysisResult = AIIntentResult & {
  categoryResult?: AIClassificationResult;
};

export function analyzeInput(
  message: string,
  userCategories?: ChatCategory[],
): AIAnalysisResult {
  const intentResult = classifyIntent(message);

  let categoryResult: AIClassificationResult | undefined;
  if (
    userCategories &&
    userCategories.length > 0 &&
    (intentResult.intent === "add_expense" || intentResult.intent === "unknown") &&
    intentResult.confidence > 0
  ) {
    categoryResult = classifyCategory(message, userCategories);
    if (categoryResult) {
      intentResult.entities.categoryCandidate = categoryResult.category;
      intentResult.entities.categoryConfidence = categoryResult.confidence;
      intentResult.entities.categoryCandidates = categoryResult.candidates;
    }
  }

  if (
    intentResult.intent === "unknown" &&
    intentResult.confidence > 0 &&
    categoryResult &&
    categoryResult.confidence >= 0.7
  ) {
    intentResult.intent = "add_expense";
    intentResult.confidence = categoryResult.confidence * 0.85;
  }

  return {
    ...intentResult,
    categoryResult,
  };
}
