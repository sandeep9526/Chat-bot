"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConical, MessageSquare, FileText, Trash2, SendHorizonal } from "lucide-react";
import { useSendMessage } from "@/hooks/useZevaApi";
import type { ChatSource } from "@/lib/types";

import { cn } from "@/lib/cn";

export interface PlaygroundMsg {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  isGuardrail?: boolean;
  limitReached?: boolean;
}

let seq = 0;

export function TestChatBox({ 
  botId, 
  botName, 
  welcomeMessage, 
  autoAnimate = false, 
  suggestions,
  messages = [],
  onMessagesChange,
  onClear
}: { 
  botId: string; 
  botName?: string; 
  welcomeMessage?: string; 
  autoAnimate?: boolean; 
  suggestions?: string[];
  messages?: PlaygroundMsg[];
  onMessagesChange?: (msgs: PlaygroundMsg[]) => void;
  onClear?: () => void;
}) {
  const displayTitle = botName && botName.trim() ? botName.trim() : "OchreShift AI Assistant";
  const displayWelcome = welcomeMessage && welcomeMessage.trim() ? welcomeMessage.trim() : "Hi there! How can I help you today?";
  const initial = displayTitle.charAt(0).toUpperCase() || "Z";

  const [animState, setAnimState] = useState<"closed" | "opening" | "open">(autoAnimate ? "closed" : "open");

  useEffect(() => {
    if (!autoAnimate) {
      setAnimState("open");
      return;
    }

    // If we are auto-animating but the user hasn't provided a name or welcome message yet,
    // stay in the closed state and wait.
    if (!botName?.trim() || !welcomeMessage?.trim()) {
      setAnimState("closed");
      return;
    }

    let timeout: NodeJS.Timeout;
    if (animState === "closed") {
      timeout = setTimeout(() => setAnimState("opening"), 2000);
    } else if (animState === "opening") {
      timeout = setTimeout(() => setAnimState("open"), 1500); // 1.5s typing/delay before message
    } else if (animState === "open") {
      timeout = setTimeout(() => setAnimState("closed"), 5000); // 5s reading time
    }
    return () => clearTimeout(timeout);
  }, [animState, autoAnimate, botName, welcomeMessage]);

  const [internalMessages, setInternalMessages] = useState<PlaygroundMsg[]>([]);
  const actualMessages = onMessagesChange ? messages : internalMessages;
  const setActualMessages = onMessagesChange ? onMessagesChange : setInternalMessages;
  const [input, setInput] = useState("");
  const send = useSendMessage();
  const qc = useQueryClient();
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [actualMessages, send.isPending]);

  const ask = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || input).trim();
    if (!text || send.isPending) return;
    setInput("");
    
    // Optimistic update
    const newMsgs: PlaygroundMsg[] = [...actualMessages, { id: ++seq, role: "user", text }];
    setActualMessages(newMsgs);
    
    send.mutate(
      { message: text, botId },
      {
        onSuccess: (res) => {
          setActualMessages([
            ...newMsgs,
            {
              id: ++seq,
              role: "assistant",
              text: res.answer,
              sources: res.sources,
              isGuardrail: res.isGuardrail,
              limitReached: res.limitReached,
            },
          ]);
          qc.invalidateQueries({ queryKey: ["admin"] });
        },
        onError: () => {
          setActualMessages([
            ...newMsgs,
            {
              id: ++seq,
              role: "assistant",
              text: "Connection trouble — try again in a moment.",
            },
          ]);
        },
      },
    );
  };

  const samplePrompts = (suggestions !== undefined ? suggestions : [
    "What services do you provide?",
    "What are your business hours?",
    "How can I contact support?",
    "Tell me about pricing plans",
  ]).filter((p) => p.trim());

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full w-full bg-surface relative">
      {/* Chat Header */}
      <div className="bg-panel/40 border-b border-border px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-white font-[700] text-[16px] shadow-sm">
            {initial}
          </div>
          <div className="flex flex-col">
            <span className="text-fg font-[700] text-[15px] leading-tight line-clamp-1">{displayTitle}</span>
            <span className="text-muted font-[500] text-[12px] flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Playground Active
            </span>
          </div>
        </div>
        {actualMessages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (onClear) onClear();
              else setActualMessages([]);
            }}
            className="text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors p-2 rounded-lg"
            title="Clear Chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-surface custom-scrollbar">
        {animState === "open" && (
          <div className="flex items-start gap-2 animate-fade-in-up">
            <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-white font-[700] text-[11px] shrink-0 mt-1">
              {initial}
            </div>
            <div className="bg-surface border border-border/50 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] text-fg leading-relaxed max-w-[85%]">
              {displayWelcome}
            </div>
          </div>
        )}
        {animState === "opening" && (
          <div className="flex items-start gap-2 animate-fade-in">
            <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-white font-[700] text-[11px] shrink-0 mt-1">
              {initial}
            </div>
            <div className="bg-surface border border-border/50 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}

        {actualMessages.map((m) => (
          <div key={m.id} className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-white font-[700] text-[11px] shrink-0 mt-1 mr-2">
                {initial}
              </div>
            )}

            <div
              className={cn(
                "px-4 py-2.5 text-[13.5px] leading-[1.6] max-w-[85%] shadow-sm",
                m.role === "user"
                  ? "bg-accent text-white rounded-2xl rounded-tr-sm font-[400]"
                  : "bg-surface border border-border/50 rounded-2xl rounded-tl-sm text-fg"
              )}
            >
              <p>{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2.5 border-t border-border/60">
                  {m.sources.map((s, i) => (
                    <span key={i} className="text-[10px] text-muted flex items-center gap-1 bg-panel px-2 py-0.5 rounded-full border border-border/40">
                      <FileText className="h-3 w-3" /> {s.file}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {send.isPending && (
          <div className="flex items-start gap-2">
            <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-white font-[700] text-[11px] shrink-0 mt-1">
              {initial}
            </div>
            <div className="bg-surface border border-border/50 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={streamEndRef} />
      </div>

      {/* Suggestions */}
      {actualMessages.length === 0 && animState === "open" && !autoAnimate && samplePrompts.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-4 bg-surface shrink-0">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={(e) => ask(e, prompt)}
              disabled={send.isPending}
              className="text-left bg-panel hover:bg-accent/10 hover:text-accent hover:border-accent/30 border border-border rounded-full px-4 py-2 text-[12.5px] text-fg transition-all disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Composer Input */}
      {!autoAnimate && (
        <div className="p-4 bg-surface border-t border-border shrink-0">
          <form onSubmit={ask} className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your agent..."
              disabled={send.isPending}
              className="w-full rounded-2xl border border-border bg-panel pl-5 pr-14 py-3.5 text-[14px] text-fg outline-none focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || send.isPending}
              className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-50 disabled:bg-muted hover:bg-accent-strong transition-colors"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
