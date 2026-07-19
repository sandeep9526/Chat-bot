"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
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
          // Real chat just happened — refresh the stat cards/top-questions
          // above without needing a manual page reload.
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

  return (
    <div className="rounded-r2 border border-border bg-surface p-4 shadow-panel">
      <b className="text-sm font-[750]">Test your bot</b>
      <p className="mt-0.5 mb-3 text-[12px] text-muted">
        Chat with this bot exactly as a visitor would — same engine, same answers.
      </p>

      <div className="ae-stream mb-3 flex max-h-[420px] min-h-[220px] flex-col gap-2.5 overflow-y-auto rounded-[10px] bg-panel p-3">
        {messages.length === 0 && (
          <span className="text-[13px] text-muted">
            Ask something below — e.g. &quot;What are your hours?&quot; or &quot;How much does it cost?&quot;
          </span>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] rounded-[10px] rounded-br-[3px] bg-accent px-3 py-1.5 text-[13px] font-medium text-white"
                : "max-w-[85%]"
            }
          >
            {m.role === "assistant" ? (
              <div>
                <p className="m-0 text-[13.5px] text-fg">{m.text}</p>
                {m.isGuardrail && (
                  <span className="mt-1 inline-block rounded-[5px] border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10.5px] font-[600] text-amber-600">
                    guardrail — not found in your docs
                  </span>
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.sources.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-[5px] border border-border bg-surface px-1.5 py-0.5 font-mono text-[10.5px] text-faint"
                      >
                        {s.file} · {s.match}%
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
          <span className="text-[12.5px] text-muted">Thinking…</span>
        )}
      </div>

      <form onSubmit={ask} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          disabled={send.isPending}
          className="flex-1 rounded-[8px] border border-border bg-panel px-3 py-2 text-[13px] text-fg outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={send.isPending || !input.trim()}
          className="cursor-pointer rounded-[8px] bg-accent px-4 py-2 text-[13px] font-[600] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
