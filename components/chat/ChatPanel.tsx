"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { X, Send, Sparkles, AlertCircle, RefreshCw, Calendar, FolderPlus, ChevronUp, ChevronDown, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendChatMessage } from "@/lib/chat/service";
import { ChatMessage } from "@/lib/chat/types";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestedPrompts = [
  "What did I spend on groceries this month?",
  "Add ₹250 for taxi today.",
  "Add salary of ₹20,000 this month.",
  "Set monthly budget to ₹15,000.",
];

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    text: "Hi there! I'm Sage, your personal financial assistant. I can help you log transactions, analyze budgets, or answer questions about your habits. Ask me anything!",
  },
];

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFollowUp, setPendingFollowUp] = useState<any | null>(null);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isLoading, pendingFollowUp]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date(),
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
        timestamp: new Date(),
      };
      addMessage(assistantMessage);

      if (response.success) {
        // Sync context/state in real time on success
        router.refresh();
      }

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
        timestamp: new Date(),
      };
      addMessage(assistantMessage);
      if (response.success) {
        setPendingFollowUp(null);
        // Sync page UI
        router.refresh();
      } else if (response.followUp) {
        setPendingFollowUp(response.followUp.payload);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile only, or to click away on desktop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
          />

          {/* Chat Side Drawer / Sheet */}
          <motion.div
            initial={{ x: "100%", opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.95 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border-subtle bg-surface shadow-2xl transition-all sm:max-w-md lg:max-w-[420px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4 bg-surface-variant/40">
              <div className="flex items-center gap-3">
                {/* Sage Avatar with glowing status dot */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                  <Sparkles size={18} className="animate-pulse" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight text-foreground flex items-center gap-1.5">
                    Sage
                    <span className="text-[10px] font-black tracking-widest uppercase text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded-md">AI</span>
                  </h3>
                  <p className="text-xs text-muted">Ready to manage your budget</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-secondary hover:bg-surface-variant hover:text-foreground transition-all"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message Area */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 chat-scroll bg-gradient-to-b from-transparent to-surface-variant/10"
            >
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10 text-primary-600 border border-primary-500/10">
                        <Sparkles size={14} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isUser
                            ? "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white chat-msg-user"
                            : "bg-surface-variant/80 text-foreground border border-border-subtle/50 chat-msg-ai"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {message.text}
                        </p>
                      </div>
                      <span
                        className={`block text-[10px] text-muted font-bold ${
                          isUser ? "text-right mr-1" : "text-left ml-1"
                        }`}
                      >
                        {message.timestamp
                          ? message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Thinking / Typing Animation */}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10 text-primary-600 border border-primary-500/10">
                    <Sparkles size={14} />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-surface-variant/80 px-4 py-3.5 border border-border-subtle/50 chat-msg-ai">
                    <span className="chat-dot-1 h-2.5 w-2.5 rounded-full bg-primary-500 block" />
                    <span className="chat-dot-2 h-2.5 w-2.5 rounded-full bg-primary-500 block" />
                    <span className="chat-dot-3 h-2.5 w-2.5 rounded-full bg-primary-500 block" />
                  </div>
                </div>
              )}

              {/* Inline Interactive Follow-ups */}
              {pendingFollowUp && !isLoading && (
                <div className="flex gap-3 max-w-[90%] mr-auto">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10 text-primary-600 border border-primary-500/10">
                    <Sparkles size={14} />
                  </div>
                  <div className="flex-1 rounded-2xl border border-border-subtle bg-surface p-4 shadow-md chat-msg-ai space-y-3">
                    <div className="flex items-start gap-2.5 text-xs font-bold text-foreground">
                      {pendingFollowUp.missing === "date" ? (
                        <>
                          <Calendar size={15} className="text-primary-500 shrink-0 mt-0.5" />
                          <span>Select a date for this transaction:</span>
                        </>
                      ) : pendingFollowUp.missing === "sports_category" ? (
                        <>
                          <Trophy size={15} className="text-primary-500 shrink-0 mt-0.5" />
                          <span>Suggest new Sports category</span>
                        </>
                      ) : (
                        <>
                          <FolderPlus size={15} className="text-primary-500 shrink-0 mt-0.5" />
                          <span>Create category "{pendingFollowUp.details?.category}"?</span>
                        </>
                      )}
                    </div>

                    {pendingFollowUp.missing === "date" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              sendFollowUp({
                                ...pendingFollowUp.details,
                                date: new Date().toISOString(),
                              })
                            }
                            className="flex-1 rounded-xl py-2 text-xs font-bold bg-primary-500 text-white hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
                          >
                            Today
                          </button>
                          <button
                            onClick={() =>
                              sendFollowUp({
                                ...pendingFollowUp.details,
                                date: new Date(
                                  Date.now() - 24 * 60 * 60 * 1000
                                ).toISOString(),
                              })
                            }
                            className="flex-1 rounded-xl py-2 text-xs font-bold bg-surface-variant border border-border-subtle text-foreground hover:bg-border-hover active:scale-95 transition-all"
                          >
                            Yesterday
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="date"
                            onChange={(e) => {
                              if (e.target.value) {
                                sendFollowUp({
                                  ...pendingFollowUp.details,
                                  date: e.target.value,
                                });
                              }
                            }}
                            className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary-500"
                          />
                        </div>
                      </div>
                    ) : pendingFollowUp.missing === "sports_category" ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              sendFollowUp({
                                ...pendingFollowUp.details,
                                category: "Sports",
                                createCategory: true,
                              })
                            }
                            className="flex-1 rounded-xl py-2 text-xs font-bold bg-primary-500 text-white hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
                          >
                            1. Sports (Auto)
                          </button>
                          <button
                            onClick={() =>
                              sendFollowUp({
                                ...pendingFollowUp.details,
                                category: "Other",
                                createCategory: false,
                              })
                            }
                            className="flex-1 rounded-xl py-2 text-xs font-bold bg-surface-variant border border-border-subtle text-foreground hover:bg-border-hover active:scale-95 transition-all"
                          >
                            3. Skip (Other)
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="2. Enter custom category..."
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customCategoryInput.trim()) {
                                sendFollowUp({
                                  ...pendingFollowUp.details,
                                  category: customCategoryInput.trim(),
                                  createCategory: true,
                                });
                              }
                            }}
                            className="flex-1 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary-500"
                          />
                          <button
                            disabled={!customCategoryInput.trim()}
                            onClick={() => {
                              if (customCategoryInput.trim()) {
                                sendFollowUp({
                                  ...pendingFollowUp.details,
                                  category: customCategoryInput.trim(),
                                  createCategory: true,
                                });
                              }
                            }}
                            className="rounded-xl bg-primary-500/10 border border-primary-500/20 px-3 text-xs font-bold text-primary-600 hover:bg-primary-500/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              sendFollowUp({
                                ...pendingFollowUp.details,
                                createCategory: true,
                              })
                            }
                            className="flex-1 rounded-xl py-2 text-xs font-bold bg-primary-500 text-white hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
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
                            className="flex-1 rounded-xl py-2 text-xs font-bold bg-surface-variant border border-border-subtle text-foreground hover:bg-border-hover active:scale-95 transition-all"
                          >
                            Use "Other"
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Or rename category..."
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customCategoryInput.trim()) {
                                sendFollowUp({
                                  ...pendingFollowUp.details,
                                  category: customCategoryInput.trim(),
                                  createCategory: true,
                                });
                              }
                            }}
                            className="flex-1 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary-500"
                          />
                          <button
                            disabled={!customCategoryInput.trim()}
                            onClick={() => {
                              if (customCategoryInput.trim()) {
                                sendFollowUp({
                                  ...pendingFollowUp.details,
                                  category: customCategoryInput.trim(),
                                  createCategory: true,
                                });
                              }
                            }}
                            className="rounded-xl bg-primary-500/10 border border-primary-500/20 px-3 text-xs font-bold text-primary-600 hover:bg-primary-500/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            Rename
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input & Suggested Prompts Area */}
            <div className="border-t border-border-subtle p-4 bg-surface animate-fade-in">
              {/* Contextual Suggested Prompts - collapsible toggle */}
              <div className="mb-2">
                <button
                  onClick={() => setShowSuggestions((prev) => !prev)}
                  className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-muted hover:text-foreground transition-all"
                >
                  Suggested prompts
                  {showSuggestions ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>

                {showSuggestions && (
                  <div className="flex flex-col gap-2 mt-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handlePromptClick(prompt)}
                        className="rounded-xl border border-border-subtle bg-surface px-3.5 py-2 text-left text-xs font-semibold text-foreground/80 hover:border-primary-500 hover:text-foreground active:bg-surface-variant transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600">
                  <AlertCircle size={14} className="shrink-0" />
                  <p className="flex-1 font-semibold">{error}</p>
                  <button
                    onClick={sendMessage}
                    className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-700"
                    title="Retry"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              )}

              {/* Chat Input Field */}
              <div className="flex items-center gap-2 relative mt-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask Sage anything..."
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl border border-border-subtle bg-background pl-4 pr-12 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1.5 h-9 w-9 inline-flex items-center justify-center rounded-xl bg-primary-500 text-white transition hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <Send size={15} />
                </button>
              </div>
              <span className="text-[10px] text-muted text-center block mt-2 font-bold tracking-tight">
                Sage can link categories and dates automatically
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
