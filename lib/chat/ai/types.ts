export type AIIntentType =
  | "add_expense"
  | "add_income"
  | "update_budget"
  | "query_expense"
  | "query_income"
  | "query_savings"
  | "query_category"
  | "query_comparison"
  | "create_category"
  | "greeting"
  | "unknown";

export type AIEntityResult = {
  amount?: number;
  amountRaw?: string;
  amountApproximate?: boolean;
  note?: string;
  date?: string;
  dateAmbiguous?: boolean;
  categoryCandidate?: string;
  categoryConfidence?: number;
  categoryCandidates?: Array<{ name: string; type: string; score: number }>;
  incomeCategory?: string;
};

export type AIIntentResult = {
  intent: AIIntentType;
  confidence: number;
  entities: AIEntityResult;
};

export type AIClassificationResult = {
  category: string;
  categoryType: "Needs" | "Wants";
  confidence: number;
  candidates: Array<{ name: string; type: string; score: number }>;
};
