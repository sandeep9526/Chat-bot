"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  FileText,
  Trash2,
  SendHorizonal,
  Plus,
  Sparkles,
  Clock,
  HelpCircle,
  DollarSign,
  Headphones,
  Loader2,
} from "lucide-react";
import { useSendMessage } from "@/hooks/useZevaApi";
import type { ChatSource } from "@/lib/types";
import {
  fetchPlaygroundSessions,
  upsertPlaygroundSession,
  deletePlaygroundSession,
  type PlaygroundSession,
} from "@/lib/adminApi";

import { cn } from "@/lib/cn";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
import { ConfirmDialog } from "./ConfirmDialog";

export interface PlaygroundMsg {
  id: number | string;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  isGuardrail?: boolean;
  limitReached?: boolean;
}

const SUGGESTION_ICONS = [HelpCircle, Clock, Headphones, DollarSign];

export function TestChatBox({
  botId,
  botName,
  welcomeMessage,
  autoAnimate = false,
  suggestions,
  messages = [],
  onMessagesChange,
  onClear,
  previewMode
}: {
  botId: string;
  botName?: string;
  welcomeMessage?: string;
  autoAnimate?: boolean;
  suggestions?: string[];
  messages?: PlaygroundMsg[];
  onMessagesChange?: (msgs: PlaygroundMsg[]) => void;
  onClear?: () => void;
  previewMode?: boolean;
}) {
  const displayTitle =
    botName && botName.trim() ? botName.trim() : "OchreShift AI Assistant";
  const displayWelcome =
    welcomeMessage && welcomeMessage.trim()
      ? welcomeMessage.trim()
      : "Hi there! How can I help you today?";
  const initial = displayTitle.charAt(0).toUpperCase() || "Z";

  const [animState, setAnimState] = useState<"closed" | "opening" | "open">(
    autoAnimate ? "closed" : "open",
  );

  useEffect(() => {
    if (!autoAnimate) {
      setAnimState("open");
      return;
    }
    if (!botName?.trim() || !welcomeMessage?.trim()) {
      setAnimState("closed");
      return;
    }
    let timeout: NodeJS.Timeout;
    if (animState === "closed") {
      timeout = setTimeout(() => setAnimState("opening"), 2000);
    } else if (animState === "opening") {
      timeout = setTimeout(() => setAnimState("open"), 1500);
    } else if (animState === "open") {
      timeout = setTimeout(() => setAnimState("closed"), 5000);
    }
    return () => clearTimeout(timeout);
  }, [animState, autoAnimate, botName, welcomeMessage]);

  const [internalMessages, setInternalMessages] = useState<PlaygroundMsg[]>([]);
  const actualMessages = onMessagesChange ? messages : internalMessages;
  const setActualMessages = onMessagesChange
    ? onMessagesChange
    : setInternalMessages;
  const [input, setInput] = useState("");
  const send = useSendMessage();
  const qc = useQueryClient();
  const streamEndRef = useRef<HTMLDivElement>(null);

  // --- Session Management ---
  const [sessions, setSessions] = useState<PlaygroundSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("new");

  useEffect(() => {
    if (previewMode) return;
    fetchPlaygroundSessions(botId)
      .then((data) => setSessions(data))
      .catch((err) =>
        console.error("Failed to load playground sessions:", err),
      );
  }, [botId, previewMode]);

  useEffect(() => {
    if (activeSessionId === "new") {
      setInternalMessages([]);
      setAnimState(autoAnimate ? "closed" : "open");
    } else {
      const s = sessions.find((x) => x.id === activeSessionId);
      if (s && s.messages) {
        setInternalMessages(s.messages as PlaygroundMsg[]);
        setAnimState("open");
      }
    }
  }, [activeSessionId, sessions, autoAnimate]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteSession = async (id: string) => {
    setDeletingId(id);
    setDeleteError("");
    try {
      await deletePlaygroundSession(botId, id);
      setConfirmDeleteId(null);
      setDeletingId(null);
      // Trigger exit animation
      setRemovingId(id);
      setTimeout(() => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setRemovingId(null);
        if (activeSessionId === id) setActiveSessionId("new");
      }, 300);
    } catch (err) {
      setDeletingId(null);
      setDeleteError("Failed to delete this chat. Please try again.");
      console.error("Failed to delete session", err);
    }
  };

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [actualMessages, send.isPending]);

  const ask = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || input).trim();
    if (!text || send.isPending) return;
    setInput("");

    const newMsgs: PlaygroundMsg[] = [
      ...actualMessages,
      { id: crypto.randomUUID(), role: "user", text },
    ];
    setActualMessages(newMsgs);

    let currentSessionId = activeSessionId;
    let isNew = false;
    if (currentSessionId === "new") {
      currentSessionId = crypto.randomUUID();
      setActiveSessionId(currentSessionId);
      isNew = true;
      const newSession: PlaygroundSession = {
        id: currentSessionId,
        title: text.slice(0, 40) + (text.length > 40 ? "..." : ""),
        messages: newMsgs,
        updated_at: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
    }

    send.mutate(
      { message: text, botId },
      {
        onSuccess: (res) => {
          const finalMsgs = [
            ...newMsgs,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              text: res.answer,
              sources: res.sources,
              isGuardrail: res.isGuardrail,
              limitReached: res.limitReached,
            } as PlaygroundMsg,
          ];
          setActualMessages(finalMsgs);
          qc.invalidateQueries({ queryKey: ["admin"] });

          const titleToSave = isNew
            ? text.slice(0, 40) + (text.length > 40 ? "..." : "")
            : sessions.find((s) => s.id === currentSessionId)?.title || "Chat";
          upsertPlaygroundSession(
            botId,
            currentSessionId,
            titleToSave,
            finalMsgs,
          ).catch((err) => {
            console.error("Failed to save session", err);
          });
        },
        onError: () => {
          setActualMessages([
            ...newMsgs,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              text: "Connection trouble — try again in a moment.",
            },
          ]);
        },
      },
    );
  };

  const samplePrompts = (
    suggestions !== undefined
      ? suggestions
      : [
        "What services do you provide?",
        "What are your business hours?",
        "How can I contact support?",
        "Tell me about pricing plans",
      ]
  ).filter((p) => p.trim());

  const isEmptyState =
    actualMessages.length === 0 && activeSessionId === "new";

  const renderComposer = () => (
    <form
      onSubmit={ask}
      className="relative w-full max-w-3xl mx-auto flex items-center gap-2 bg-panel/50 border border-border/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] focus-within:border-accent focus-within:shadow-[0_2px_20px_-4px_rgba(var(--accent-rgb),0.15)] focus-within:ring-4 focus-within:ring-accent/10 rounded-2xl p-1.5 transition-all"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask your agent a question..."
        disabled={send.isPending}
        className="flex-1 w-full bg-transparent pl-4 pr-2 py-2.5 text-[14px] text-fg outline-none placeholder:text-muted/50 disabled:opacity-50 font-[500]"
      />
      <button
        type="submit"
        disabled={!input.trim() || send.isPending}
        className="h-[40px] w-[40px] shrink-0 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40 disabled:bg-panel disabled:text-muted hover:bg-accent-strong shadow-sm transition-all"
      >
        <SendHorizonal className="h-4 w-4" />
      </button>
    </form>
  );

  return (
    <div className="relative w-full" style={{ height: previewMode ? "100%" : "calc(100vh - 62px - 90px - 48px)" }}>
      {/* ═══════════ Collapsed Icon ═══════════ */}
      {previewMode && (
        <div
          className={cn(
            "absolute bottom-0 right-0 z-20 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-white shadow-[0_12px_40px_-12px_var(--accent)] transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            (animState === "closed" && autoAnimate) ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          <MessageSquare className="h-7 w-7" />
        </div>
      )}

      {/* ═══════════ Main Chat Box ═══════════ */}
      <div
        className={cn(
          "flex w-full h-full bg-surface relative rounded-r2 border border-border shadow-card overflow-hidden transition-all duration-[600ms] origin-bottom-right ease-[cubic-bezier(0.16,1,0.3,1)]",
          (previewMode && animState === "closed" && autoAnimate) ? "scale-90 opacity-0 pointer-events-none translate-y-6" : "scale-100 opacity-100 translate-y-0"
        )}
      >
        {/* ═══════════ Sidebar ═══════════ */}
        {!previewMode && (
          <div className="w-64 border-r border-border bg-panel/30 flex flex-col shrink-0">
            <div className="p-4 border-b border-border/80">
              <button
                type="button"
                onClick={() => setActiveSessionId("new")}
                className="w-full rounded-lg bg-accent px-4 py-2 text-[13px] font-[650] text-white shadow-sm hover:bg-accent-strong transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
              {sessions.map((s) => {
                const isActive = activeSessionId === s.id;
                const isRemoving = removingId === s.id;
                const isDeleting = deletingId === s.id;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "group flex items-center justify-between p-2 rounded-lg text-[13px] transition-all cursor-pointer",
                      isActive
                        ? "bg-surface shadow-sm border border-border/80 text-fg"
                        : "hover:bg-surface/80 border border-transparent text-muted hover:text-fg",
                      isRemoving && "opacity-0 -translate-x-full h-0 !p-0 !m-0 overflow-hidden",
                    )}
                    style={{ transition: isRemoving ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : undefined }}
                    onClick={() => !isRemoving && setActiveSessionId(s.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-[500] leading-tight pt-0.5">
                        {s.title || "New Chat"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteError("");
                        setConfirmDeleteId(s.id);
                      }}
                      disabled={!!isDeleting}
                      className={cn(
                        "shrink-0 p-1 rounded hover:bg-bad/10 hover:text-bad transition-colors",
                        isActive
                          ? "opacity-100 text-muted"
                          : "opacity-0 group-hover:opacity-100 text-faint",
                      )}
                      title="Delete chat"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <div className="p-4 text-center text-[12px] text-faint mt-4">
                  No chat history yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ Main Chat Area ═══════════ */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface relative">
          {/* Chat Header */}
          <div className="bg-surface border-b border-border px-5 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm relative">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-white font-[700] text-[16px] shadow-[0_4px_12px_-4px_var(--accent)]">
                {initial}
              </div>
              <div className="flex flex-col">
                <span className="text-fg font-[800] text-[15px] leading-tight line-clamp-1 tracking-tight">
                  {displayTitle}
                </span>
                <span className="text-muted font-[600] text-[11.5px] flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Playground Active
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════ Chat Content ═══════════ */}
          <div className={cn("flex-1 overflow-y-auto flex flex-col bg-surface relative", !previewMode && "custom-scrollbar")}>
            {/* ── Branded Welcome (empty state) ── */}
            {isEmptyState && animState === "open" && !autoAnimate ? (
              <div className={cn("flex-1 flex flex-col items-center relative min-h-max", previewMode ? "px-4 pt-12 pb-8 justify-start" : "px-6 justify-center")}>
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-3xl" />
                </div>

                {/* Animated Avatar */}
                <div className="relative mb-5 animate-avatar-entrance">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center shadow-[0_12px_40px_-12px_var(--accent)] ring-4 ring-accent/10 p-3">
                    <OchreshiftLogo variant="mark" className="h-full w-full" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-ring-expand" />
                  <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-surface border-2 border-border flex items-center justify-center shadow-sm animate-scale-in" style={{ animationDelay: "0.4s" }}>
                    <Sparkles className="h-3 w-3 text-accent" />
                  </div>
                </div>

                {/* Welcome copy */}
                <div className="text-center max-w-md relative z-10 animate-slide-up-fade" style={{ animationDelay: "0.2s" }}>
                  <h2 className="text-[20px] font-[800] text-fg tracking-tight">
                    Test your agent
                  </h2>
                  <p className="mt-1.5 text-[13.5px] text-muted font-[500] leading-relaxed">
                    {displayWelcome}
                  </p>
                </div>

                {/* Suggestion Cards */}
                {samplePrompts.length > 0 && (
                  <div className={cn("mt-6 grid gap-1 w-full relative z-10", previewMode ? "grid-cols-1 px-2" : "grid-cols-2 max-w-md")}>
                    {samplePrompts.map((prompt, idx) => {
                      const Icon = SUGGESTION_ICONS[idx % SUGGESTION_ICONS.length];
                      return (
                        <button
                          key={idx}
                          onClick={(e) => ask(e, prompt)}
                          disabled={send.isPending}
                          className="animate-slide-up-fade group flex items-start gap-2.5 text-left bg-surface border border-border/60 hover:border-accent/40 rounded-xl p-3 transition-all hover:shadow-md hover:-translate-y-[2px] disabled:opacity-50"
                          style={{ animationDelay: `${0.35 + idx * 0.08}s` }}
                        >
                          <div className="grid place-items-center h-8 w-8 rounded-lg bg-accent/10 text-accent shrink-0 group-hover:bg-accent/20 transition-colors">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[12.5px] font-[550] text-fg leading-snug pt-1 group-hover:text-accent transition-colors">
                            {prompt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Centered Composer for Empty State */}
                <div className={cn("mt-8 w-full relative z-10 animate-slide-up-fade", previewMode ? "px-2" : "max-w-2xl px-4")} style={{ animationDelay: "0.6s" }}>
                  {renderComposer()}
                </div>

                <p className="mt-4 text-[11px] text-faint font-[500] animate-slide-up-fade relative z-10" style={{ animationDelay: "0.8s" }}>
                  Answers from your knowledge base only — no hallucinations.
                </p>
              </div>
            ) : (
              /* ── Conversation View ── */
              <div className="flex-1 flex flex-col p-5 gap-4">
                {/* Welcome bubble */}
                {animState === "open" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2.5 animate-slide-up-fade">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-white font-[700] text-[12px] shrink-0 mt-0.5 shadow-sm">
                        {initial}
                      </div>
                      <div className="bg-panel/50 border border-border/50 shadow-sm rounded-2xl rounded-tl-md px-4 py-3 text-[13.5px] text-fg leading-relaxed max-w-[85%]">
                        {displayWelcome}
                      </div>
                    </div>
                  </div>
                )}
                {animState === "opening" && (
                  <div className="flex items-start gap-2.5 animate-slide-up-fade">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-white font-[700] text-[12px] shrink-0 mt-0.5 shadow-sm">
                      {initial}
                    </div>
                    <div className="bg-panel/50 border border-border/50 shadow-sm rounded-2xl rounded-tl-md px-4 py-3.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* Messages */}
                {actualMessages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex w-full animate-slide-up-fade",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {m.role === "assistant" && (
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-white font-[700] text-[12px] shrink-0 mt-0.5 mr-2.5 shadow-sm">
                        {initial}
                      </div>
                    )}
                    <div
                      className={cn(
                        "px-5 py-3 text-[14px] leading-[1.65] max-w-[80%]",
                        m.role === "user"
                          ? "bg-gradient-to-br from-accent to-accent-strong text-white rounded-2xl rounded-tr-md font-[450] shadow-[0_4px_16px_-6px_var(--accent)]"
                          : "bg-panel/50 border border-border/50 rounded-2xl rounded-tl-md text-fg shadow-sm",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2.5 border-t border-border/40">
                          {m.sources.map((s, i) => (
                            <span
                              key={i}
                              className="text-[10.5px] text-muted flex items-center gap-1 bg-surface px-2.5 py-0.5 rounded-full border border-border/40 font-[500]"
                            >
                              <FileText className="h-3 w-3" /> {s.file}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {send.isPending && (
                  <div className="flex items-start gap-2.5 animate-fade-in">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-white font-[700] text-[12px] shrink-0 mt-0.5 shadow-sm">
                      {initial}
                    </div>
                    <div className="bg-panel/50 border border-border/50 shadow-sm rounded-2xl rounded-tl-md px-4 py-3.5 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={streamEndRef} />
              </div>
            )}
          </div>

          {/* ═══════════ Bottom Composer ═══════════ */}
          {!autoAnimate && !isEmptyState && (
            <div className="p-4 md:p-5 bg-surface shrink-0 relative z-10 transition-all duration-300 ease-in-out border-t border-border/40">
              {renderComposer()}

              {/* Optional footer branding for widget */}
              {previewMode && (
                <div className="mt-3 text-center">
                  <span className="text-[10px] font-[600] text-faint flex items-center justify-center gap-1">
                    Powered by <OchreshiftLogo variant="default" className="h-2.5 opacity-60" />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete this chat?"
          body="This conversation will be permanently removed from your history. This action cannot be undone."
          confirmLabel="Delete Chat"
          busyLabel="Deleting…"
          busy={!!deletingId}
          error={deleteError || undefined}
          onCancel={() => {
            setConfirmDeleteId(null);
            setDeleteError("");
          }}
          onConfirm={() => handleDeleteSession(confirmDeleteId)}
        />
      )}
    </div>
  );
}
