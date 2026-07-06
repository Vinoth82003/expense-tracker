"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { sendChatMessage } from "@/lib/chat/service";
import { ChatMessage } from "@/lib/chat/types";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestedPrompts = [
  "What did I spend on groceries this month?",
  "Add an expense of ₹250 for taxi today.",
  "Add income of ₹20,000 for salary this month.",
  "Set my monthly budget to ₹15,000.",
  "How is my budget performing this week?",
];

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    text: "Hi there! I can help you understand your expenses, income, budget, and reports. Ask me anything.",
  },
];

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const [pendingFollowUp, setPendingFollowUp] = useState<any | null>(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    addMessage(userMessage);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(trimmed);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          response.reply ||
          "I couldn't generate a response. Please try again in a moment.",
      };
      addMessage(assistantMessage);

      // If server indicates follow-up required, store payload to present UI
      if (response.success === false && response.followUp) {
        setPendingFollowUp(response.followUp.payload);
      } else {
        setPendingFollowUp(null);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendFollowUp = async (details: any, intentType = "add_expense") => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sendChatMessage(undefined, details, intentType);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: response.reply || "",
      };
      addMessage(assistantMessage);
      if (response.success) {
        setPendingFollowUp(null);
      } else if (response.followUp) {
        setPendingFollowUp(response.followUp.payload);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full max-w-3xl rounded-[2rem] border border-border-subtle bg-surface shadow-2xl shadow-black/20 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border-subtle bg-background/80">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary-500/10 text-primary-600 grid place-items-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Expense Assistant</h2>
                  <p className="text-sm text-muted">
                    Ask about your spending, budgets, and reports.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-2xl p-3 text-secondary hover:bg-surface-variant transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-hidden">
              <div
                ref={messageListRef}
                className="space-y-4 p-6 overflow-y-auto max-h-[42vh] text-sm text-foreground"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-3xl p-4 ${message.role === "user" ? "bg-primary-500/10 self-end text-primary-900" : "bg-surface-variant"}`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-subtle p-6 bg-background/80">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-left text-xs text-foreground/80 hover:border-primary-500 hover:text-foreground transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {error ? (
                  <p className="text-sm text-rose-500">{error}</p>
                ) : null}

                {pendingFollowUp ? (
                  <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-sm">
                    <p className="mb-2">
                      {pendingFollowUp.missing === "date"
                        ? "Please select a date for this expense:"
                        : "I couldn't find the category — would you like to create it?"}
                    </p>
                    {pendingFollowUp.missing === "date" ? (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            sendFollowUp({
                              ...pendingFollowUp.details,
                              date: new Date().toISOString(),
                            })
                          }
                          className="rounded-2xl px-3 py-2 bg-primary-500 text-white"
                        >
                          Today
                        </button>
                        <button
                          onClick={() =>
                            sendFollowUp({
                              ...pendingFollowUp.details,
                              date: new Date(
                                Date.now() - 24 * 60 * 60 * 1000,
                              ).toISOString(),
                            })
                          }
                          className="rounded-2xl px-3 py-2 bg-primary-500 text-white"
                        >
                          Yesterday
                        </button>
                        <label className="rounded-2xl px-3 py-2 bg-surface border cursor-pointer">
                          <input
                            type="date"
                            onChange={(e) =>
                              sendFollowUp({
                                ...pendingFollowUp.details,
                                date: e.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap items-center">
                        <button
                          onClick={() =>
                            sendFollowUp({
                              ...pendingFollowUp.details,
                              createCategory: true,
                            })
                          }
                          className="rounded-2xl px-3 py-2 bg-primary-500 text-white"
                        >
                          Yes, create it
                        </button>
                        <button
                          onClick={() =>
                            sendFollowUp({
                              ...pendingFollowUp.details,
                              createCategory: false,
                            })
                          }
                          className="rounded-2xl px-3 py-2 bg-surface border"
                        >
                          No, put in Other
                        </button>
                        <div className="flex items-center gap-2">
                          <input
                            placeholder="Category name"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = (
                                  e.target as HTMLInputElement
                                ).value.trim();
                                if (val)
                                  sendFollowUp({
                                    ...pendingFollowUp.details,
                                    category: val,
                                    createCategory: true,
                                  });
                              }
                            }}
                            className="rounded px-2 py-1 border"
                          />
                          <button
                            onClick={(e) => {
                              const inputEl = e.currentTarget
                                .previousSibling as HTMLInputElement;
                              const val = inputEl?.value?.trim();
                              if (val)
                                sendFollowUp({
                                  ...pendingFollowUp.details,
                                  category: val,
                                  createCategory: true,
                                });
                            }}
                            className="rounded-2xl px-3 py-2 bg-primary-500 text-white"
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="min-h-[96px] w-full resize-none rounded-3xl border border-border-subtle bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Type your question or instruction..."
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={isLoading}
                    className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-3xl bg-primary-500 px-6 text-sm font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
