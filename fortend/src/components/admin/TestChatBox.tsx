"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConical, MessageSquare, FileText } from "lucide-react";
import { useSendMessage } from "@/hooks/useZevaApi";
import type { ChatSource } from "@/lib/types";

interface Msg {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  isGuardrail?: boolean;
}

let seq = 0;

/**
 * Lets the bot owner chat with their OWN bot directly from the dashboard —
 * there was previously no way to do this without an external test page:
 * /demo and /studio are both hardcoded to the acme-salon demo bot, not
 * whichever bot is selected here. Reuses the same useSendMessage() hook
 * the real widget uses (POST /chat with this botId), so what you see here
 * is exactly what a real visitor would get — not a separate mock path.
 */
export function TestChatBox({ botId }: { botId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const send = useSendMessage();
  const qc = useQueryClient();
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, send.isPending]);

  const ask = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || input).trim();
    if (!text || send.isPending) return;
    setInput("");
    setMessages((m) => [...m, { id: ++seq, role: "user", text }]);
    send.mutate(
      { message: text, botId },
      {
        onSuccess: (res) => {
          setMessages((m) => [
            ...m,
            {
              id: ++seq,
              role: "assistant",
              text: res.answer,
              sources: res.sources,
              isGuardrail: res.isGuardrail,
            },
          ]);
          qc.invalidateQueries({ queryKey: ["admin"] });
        },
        onError: () => {
          setMessages((m) => [
            ...m,
            {
              id: ++seq,
              role: "assistant",
              text: "Couldn't reach the server just now. Try again in a moment.",
            },
          ]);
        },
      },
    );
  };

  const samplePrompts = [
    "What services do you provide?",
    "What are your business hours?",
    "How can I contact support?",
    "Tell me about pricing plans",
  ];

  return (
    <div className="overflow-hidden rounded-r2 border border-border/80 bg-surface shadow-card">
      {/* Workbench Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-panel/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-r1 bg-accent/15 text-accent">
            <FlaskConical className="h-4 w-4" />
          </span>
          <div>
            <b className="text-base font-[800]">Test your bot</b>
            <p className="text-xs text-muted">Try real questions and see exactly what your visitors would get</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-good/10 px-3 py-1 text-xs font-[700] text-good flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-good animate-pulse" />
            Bot ID: {botId}
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="cursor-pointer rounded-r1 border border-border bg-surface px-3 py-1 text-xs font-[650] text-muted hover:text-fg"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left Side: Parameters & Quick Prompts */}
        <div className="lg:col-span-4 border-r border-border/60 bg-panel/20 p-5 flex flex-col justify-between border-b lg:border-b-0">
          <div>
            <span className="text-[11px] font-[800] uppercase tracking-[.15em] text-muted">
              How this bot answers
            </span>
            <div className="mt-3 flex flex-col gap-3">
              <div className="rounded-r1 border border-border/70 bg-surface p-3 text-xs">
                <div className="flex justify-between font-[650] text-fg">
                  <span>Answers from your documents</span>
                  <span className="text-good font-[750]">On</span>
                </div>
                <p className="mt-1 text-[11px] text-muted leading-relaxed">
                  Every answer comes only from the docs you&apos;ve uploaded — never made up.
                </p>
              </div>

              <div className="rounded-r1 border border-border/70 bg-surface p-3 text-xs">
                <div className="flex justify-between font-[650] text-fg">
                  <span>Off-topic questions</span>
                  <span className="text-accent font-[750]">Redirected</span>
                </div>
                <p className="mt-1 text-[11px] text-muted leading-relaxed">
                  Off-topic questions get a polite redirect instead of a guess.
                </p>
              </div>
            </div>

            <span className="mt-6 block text-[11px] font-[800] uppercase tracking-[.15em] text-muted">
              Quick test prompts
            </span>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => ask(undefined, p)}
                  disabled={send.isPending}
                  className="rounded-r1 border border-border/80 bg-surface px-3 py-2 text-left text-xs font-[600] text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer"
                >
                  &quot;{p}&quot;
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 text-[11px] text-faint font-[550]">
            Runs the same answer engine your visitors use.
          </div>
        </div>

        {/* Right Side: Interactive Chat Display */}
        <div className="lg:col-span-8 flex flex-col justify-between p-5 bg-surface">
          <div className="ae-stream flex-1 max-h-[380px] overflow-y-auto pr-2 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-muted">
                <MessageSquare className="h-7 w-7 mb-2 text-faint" strokeWidth={1.8} />
                <b className="text-sm font-[700] text-fg">Try it out</b>
                <p className="text-xs max-w-xs mt-1">
                  Type a question below or click a quick prompt to test real visitor experience.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] rounded-2xl rounded-tr-xs bg-accent px-4 py-2.5 text-xs font-[600] text-white shadow-sm"
                    : "mr-auto max-w-[88%] rounded-2xl rounded-tl-xs bg-panel border border-border/80 px-4 py-3 text-xs text-fg shadow-sm"
                }
              >
                {m.role === "assistant" ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-[800] uppercase tracking-wider text-accent">Zeva AI</span>
                      {m.isGuardrail && (
                        <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[9.5px] font-[750] text-warn">
                          Handed off
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed text-fg">{m.text}</p>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                        {m.sources.map((s, i) => (
                          <span
                            key={i}
                            className="rounded-r1 border border-border/80 bg-surface px-2 py-0.5 font-mono text-[10px] font-[600] text-muted flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            {s.file} <b className="text-good">{s.match}% match</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  m.text
                )}
              </div>
            ))}
            {send.isPending && (
              <div className="flex items-center gap-2 text-xs font-[600] text-accent animate-pulse">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Searching documents & generating answer...
              </div>
            )}
            <div ref={streamEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={ask} className="mt-4 flex gap-2 pt-3 border-t border-border/60">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your documents…"
              disabled={send.isPending}
              className="flex-1 rounded-r1 border border-border bg-panel px-4 py-2.5 text-xs text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              disabled={send.isPending || !input.trim()}
              className="cursor-pointer rounded-r1 bg-accent px-5 py-2.5 text-xs font-[750] text-white shadow-md shadow-accent/20 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ask bot
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

