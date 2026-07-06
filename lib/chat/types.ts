export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  timestamp?: Date;
};

export type ChatAPIRequest = {
  message?: string;
  // Optional structured details for multi-turn flows (e.g., expense details)
  details?: any;
  intentType?: string;
  context?: any; // Allow passing context state
};

export type ChatAPIResponse = {
  reply: string;
  error?: string;
  // optional structured response from server for richer UI handling
  success?: boolean;
  followUp?: { type: string; payload?: any };
  /** Custom window event name dispatched to sync DashboardContext in real-time */
  eventType?: "expenseAdded" | "incomeAdded" | "budgetUpdated";
  context?: any; // Allow passing back context state
  confidence?: {
    intent: string;
    score: number;
    underThreshold: boolean;
  };
};

