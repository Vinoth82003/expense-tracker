import { ChatIntentType } from "../intent";
import { ExtractedEntities } from "./entity-extractor";

export interface ContextMessage {
  role: "user" | "assistant";
  text: string;
  intent?: ChatIntentType | string;
  entities?: ExtractedEntities;
  timestamp: number;
}

export interface PendingAction {
  type: "confirm_expense" | "confirm_category" | "select_date" | "clarify_intent";
  details: Record<string, any>;
}

export interface ConversationContext {
  sessionId: string;
  messages: ContextMessage[];
  lastIntent: ChatIntentType | string;
  lastEntities: ExtractedEntities;
  pendingAction?: PendingAction;
  lastResponseType?: string;
}

export class ContextManager {
  private context: ConversationContext;
  private maxMessages: number;

  constructor(sessionId: string, maxMessages = 10) {
    this.context = {
      sessionId,
      messages: [],
      lastIntent: "unknown",
      lastEntities: {},
    };
    this.maxMessages = maxMessages;
  }

  private normalizeContext(context: Partial<ConversationContext>): ConversationContext {
    return {
      sessionId: context.sessionId || this.context?.sessionId || "unknown-session",
      messages: Array.isArray(context.messages) ? context.messages : [],
      lastIntent: context.lastIntent || "unknown",
      lastEntities: context.lastEntities || {},
      pendingAction: context.pendingAction,
      lastResponseType: context.lastResponseType,
    };
  }

  getContext(): ConversationContext {
    return this.context;
  }

  setContext(context: ConversationContext) {
    this.context = this.normalizeContext(context);
  }

  addMessage(role: "user" | "assistant", text: string, intent?: ChatIntentType | string, entities?: ExtractedEntities) {
    const message: ContextMessage = {
      role,
      text,
      intent,
      entities,
      timestamp: Date.now(),
    };
    this.context.messages.push(message);
    if (this.context.messages.length > this.maxMessages) {
      this.context.messages.shift();
    }

    if (role === "user") {
      if (intent && intent !== "unknown") {
        this.context.lastIntent = intent;
      }
      if (entities && Object.keys(entities).length > 0) {
        this.context.lastEntities = {
          ...this.context.lastEntities,
          ...entities,
        };
      }
    }
  }

  isFollowUp(message: string): boolean {
    const normalized = message.trim().toLowerCase();
    const followUpPrefixes = ["how about", "what about", "is that", "was that", "and", "then", "next", "more than", "less than"];
    const confirmationWords = ["yes", "no", "yeah", "yep", "nay", "sure", "ok", "confirm", "cancel", "create it", "add it", "do it"];

    const isPrefix = followUpPrefixes.some(p => normalized.startsWith(p) || normalized.includes(" " + p));
    const isConfirmation = confirmationWords.some(w => normalized === w || normalized.startsWith(w + " "));

    return isPrefix || isConfirmation;
  }

  resolvePronouns(message: string): string {
    let resolved = message;
    const pronouns = [/\bit\b/gi, /\bthat\b/gi, /\bthose\b/gi];
    const lastEntities = this.context.lastEntities || {};
    
    // We only resolve if we have a last entity in context
    const lastCategory = lastEntities.category;
    const lastNote = lastEntities.note;
    const replacement = lastCategory || lastNote || "";

    if (replacement) {
      for (const pattern of pronouns) {
        resolved = resolved.replace(pattern, replacement);
      }
    }
    return resolved;
  }

  carryoverEntities(currentEntities: ExtractedEntities): ExtractedEntities {
    const result = { ...currentEntities };
    const lastEntities = this.context.lastEntities || {};
    
    // Carry over category if missing but present in history
    if (!result.category && lastEntities.category) {
      result.category = lastEntities.category;
    }

    // Carry over note if missing but present in history
    if (!result.note && lastEntities.note) {
      result.note = lastEntities.note;
    }

    return result;
  }

  setPendingAction(type: PendingAction["type"], details: Record<string, any>) {
    this.context.pendingAction = { type, details };
  }

  clearPendingAction() {
    this.context.pendingAction = undefined;
  }

  getPendingAction(): PendingAction | undefined {
    return this.context.pendingAction;
  }

  serialize(): string {
    return JSON.stringify(this.context);
  }

  static deserialize(json: string, maxMessages = 10): ContextManager {
    const parsed = JSON.parse(json) as ConversationContext;
    const manager = new ContextManager(parsed.sessionId, maxMessages);
    manager.setContext(parsed);
    return manager;
  }
}
