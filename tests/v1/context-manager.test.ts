import { describe, it, expect } from "vitest";
import { ContextManager } from "@/lib/chat/v1/context-manager";

describe("ContextManager Tests", () => {
  it("maintains a sliding window of messages", () => {
    const manager = new ContextManager("session-123", 3);
    manager.addMessage("user", "msg 1");
    manager.addMessage("assistant", "reply 1");
    manager.addMessage("user", "msg 2");
    manager.addMessage("assistant", "reply 2");

    const messages = manager.getContext().messages;
    expect(messages.length).toBe(3);
    expect(messages[0].text).toBe("reply 1");
    expect(messages[2].text).toBe("reply 2");
  });

  it("handles entity carryover correctly", () => {
    const manager = new ContextManager("session-123");
    
    // Turn 1
    manager.addMessage("user", "How much did I spend on groceries this month?", "expense_summary", { category: "Food" });
    expect(manager.getContext().lastEntities.category).toBe("Food");

    // Turn 2: Follow-up query without explicit category
    const currentEntities = { dateStr: "last month" };
    const resolvedEntities = manager.carryoverEntities(currentEntities);
    expect(resolvedEntities.category).toBe("Food");
  });

  it("resolves pronouns correctly", () => {
    const manager = new ContextManager("session-123");
    
    // Turn 1
    manager.addMessage("user", "Show my entertainment expenses", "expense_summary", { category: "Entertainment" });

    // Turn 2
    const query = "Is that more than last month?";
    const resolved = manager.resolvePronouns(query);
    expect(resolved).toBe("Is Entertainment more than last month?");
  });

  it("detects follow-up and confirmation messages", () => {
    const manager = new ContextManager("session-123");
    expect(manager.isFollowUp("How about last month?")).toBe(true);
    expect(manager.isFollowUp("yes")).toBe(true);
    expect(manager.isFollowUp("Set my budget to ₹20,000")).toBe(false);
  });

  it("serializes and deserializes correctly", () => {
    const manager = new ContextManager("session-123");
    manager.addMessage("user", "Add ₹250 for taxi", "add_expense", { amount: 250, note: "taxi" });
    manager.setPendingAction("confirm_expense", { amount: 250, note: "taxi" });

    const serialized = manager.serialize();
    const deserialized = ContextManager.deserialize(serialized);

    expect(deserialized.getContext().sessionId).toBe("session-123");
    expect(deserialized.getContext().lastEntities.note).toBe("taxi");
    expect(deserialized.getPendingAction()?.type).toBe("confirm_expense");
  });

  it("handles deserialized contexts without lastEntities", () => {
    const serialized = JSON.stringify({
      sessionId: "session-legacy",
      messages: [],
      lastIntent: "unknown",
    });

    const manager = ContextManager.deserialize(serialized);

    expect(() => manager.resolvePronouns("Is that more than last month?")).not.toThrow();
    expect(manager.carryoverEntities({ dateStr: "today" })).toEqual({
      dateStr: "today",
    });
    expect(manager.getContext().lastEntities).toEqual({});
  });
});
