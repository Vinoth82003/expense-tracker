import { ChatIntentType } from "../intent";
import { ExtractedEntities } from "./entity-extractor";

export type DecisionAction = "execute" | "execute_with_suffix" | "ask_missing" | "clarify" | "fallback" | "friendly_greeting";

export interface DecisionResult {
  action: DecisionAction;
  intent: string;
  confidence: number;
  missingEntities?: string[];
  clarificationOptions?: string[];
  clarificationMessage?: string;
}

// Map intents to their required entities
const REQUIRED_ENTITIES: Record<string, string[]> = {
  add_expense: ["amount"],
  add_income: ["amount"],
  update_budget: ["amount"],
};

export function scoreAndDecide(
  intent: string,
  nluConfidence: number,
  entities: ExtractedEntities,
  message: string,
  otherIntentScores?: { intent: string; confidence: number }[]
): DecisionResult {
  const normalizedMsg = message.trim().toLowerCase();
  
  // Calculate a combined confidence score
  let finalConfidence = nluConfidence;

  // Keyword match strength bonuses/penalties
  if (intent === "add_expense" || intent === "add_income") {
    // If it contains clear action words, boost confidence
    if (normalizedMsg.includes("add") || normalizedMsg.includes("spend") || normalizedMsg.includes("spent") || normalizedMsg.includes("record")) {
      finalConfidence = Math.min(finalConfidence + 0.1, 1.0);
    }
  }

  // Handle Ambiguity: if there are other intents with close confidence
  if (otherIntentScores && otherIntentScores.length > 0) {
    // Sort descending by confidence
    const sorted = [...otherIntentScores].sort((a, b) => b.confidence - a.confidence);
    const top2 = sorted.slice(0, 2);
    if (top2.length === 2 && Math.abs(top2[0].confidence - top2[1].confidence) < 0.15) {
      // If they are ambiguous and we are not extremely confident in the first one
      if (top2[0].confidence < 0.85) {
        // Return clarification action
        const options = top2.map(item => {
          if (item.intent === "expense_summary") return "See your spending summary";
          if (item.intent === "add_expense") return "Add a new expense";
          if (item.intent === "budget_status") return "Check your budget status";
          if (item.intent === "add_income") return "Add a new income";
          if (item.intent === "income_summary") return "See your income summary";
          return `Perform ${item.intent.replace("_", " ")}`;
        });
        
        return {
          action: "clarify",
          intent: "ambiguous",
          confidence: top2[0].confidence,
          clarificationOptions: options,
          clarificationMessage: "I'm not sure what you mean. Did you want to:",
        };
      }
    }
  }

  // Verify missing required entities
  const required = REQUIRED_ENTITIES[intent] || [];
  const missing = required.filter(field => {
    if (field === "amount") return entities.amount === undefined || isNaN(entities.amount);
    if (field === "category") return entities.category === undefined;
    return false;
  });

  // Threshold decision making
  if (finalConfidence >= 0.8) {
    if (intent === "greeting") {
      return { action: "friendly_greeting", intent, confidence: finalConfidence };
    }
    if (missing.length > 0) {
      return {
        action: "ask_missing",
        intent,
        confidence: finalConfidence,
        missingEntities: missing,
      };
    }
    return { action: "execute", intent, confidence: finalConfidence };
  }

  if (finalConfidence >= 0.5) {
    return { action: "execute_with_suffix", intent, confidence: finalConfidence };
  }

  if (finalConfidence >= 0.3) {
    // Low confidence: Clarify with options
    const options = [
      "See your spending summary",
      "Add a new expense",
      "Check your budget status"
    ];
    return {
      action: "clarify",
      intent,
      confidence: finalConfidence,
      clarificationOptions: options,
      clarificationMessage: "I'm not sure what you mean. Did you want to:",
    };
  }

  // Very low confidence
  return {
    action: "fallback",
    intent: "unknown",
    confidence: finalConfidence,
  };
}
