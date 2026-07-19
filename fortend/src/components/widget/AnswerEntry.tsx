"use client";

import { useEffect, useMemo, useState } from "react";
import { ProofCard } from "./ProofCard";
import { LeadTicket, LeadStub } from "./LeadTicket";
import { useZevaStore } from "@/stores/zevaStore";
import type { ChatMessage } from "@/lib/types";

interface AnswerEntryProps {
  message: ChatMessage;
  showSources: boolean;
}

export function AnswerEntry({ message, showSources }: AnswerEntryProps) {
  const name = useZevaStore((s) => s.config.name);
  const updateMessage = useZevaStore((s) => s.updateMessage);

  const [revealed, setRevealed] = useState(false);
  const hasSource = Boolean(message.sources && message.sources.length > 0);

  // Unfold the proof card a beat after it mounts (matches the prototype).
  useEffect(() => {
    if (!hasSource) return;
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, [hasSource]);

  // User question bubble.
  if (message.role === "user") {
    return (
      <div className="max-w-[85%] self-end rounded-r1 rounded-br-[5px] bg-accent px-3 py-2 text-[13px] font-medium text-white">
        {message.text}
      </div>
    );
  }

  // Assistant answer.
  const showProof = showSources && hasSource;

  return (
    <div>
      <div className="flex items-start gap-[9px]">
        <CheckCircleIcon className="mt-[3px] h-4 w-4 shrink-0 text-accent" />
        <TypewriterText text={message.text} />
      </div>

      {/* Guardrail: no matching source. */}
      {message.isGuardrail && (
        <div className="mt-3 flex items-center gap-2.5 rounded-r2 border border-dashed border-border px-3 py-2.5 text-[12.5px] text-muted">
          <WarningIcon className="h-4 w-4 shrink-0 text-amber-500" />
          No matching source — routing you to a human.
        </div>
      )}

      {/* Sourced answer: link connector + proof card. */}
      {showProof && (
        <>
          <div className="relative my-2 ml-[7px] h-4 w-[2px] bg-gradient-to-b from-accent to-transparent">
            <span className="absolute bottom-0 left-[-2px] h-[6px] w-[6px] rounded-full bg-accent" />
          </div>
          {message.sources!.map((src, i) => (
            <div key={i} className="mt-2">
              <ProofCard source={src} isRevealed={revealed} />
            </div>
          ))}
        </>
      )}

      {/* Offer to capture a lead after a sourced answer. */}
      {hasSource && !message.isGuardrail && !message.ticketState && (
        <div className="mt-3">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-[7px] rounded-r1 border border-border bg-panel px-3 py-2 font-ui text-[12.5px] font-[600] text-fg transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => updateMessage(message.id, { ticketState: "idle" })}
          >
            <UserPlusIcon className="h-3.5 w-3.5 text-accent" />
            Book / leave my details
          </button>
        </div>
      )}

      {/* Lead ticket (guardrail auto-shows it; sourced answers open it on click). */}
      {message.ticketState === "idle" && (
        <div className="mt-3">
          <LeadTicket
            botName={name}
            onDone={(leadName) =>
              updateMessage(message.id, { ticketState: "gone", leadName })
            }
          />
        </div>
      )}

      {/* Handoff stub. */}
      {message.ticketState === "gone" && (
        <div className="mt-3">
          <LeadStub name={message.leadName ?? "This visitor"} />
        </div>
      )}
    </div>
  );
}

/** Word-by-word typewriter. State only ever changes inside the interval. */
function TypewriterText({ text }: { text: string }) {
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [shown, setShown] = useState(() => (reduce ? text : ""));

  useEffect(() => {
    if (reduce) return;
    const words = text.split(" ");
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setShown(words.slice(0, i).join(" "));
      if (i >= words.length) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [text, reduce]);

  return (
    <span className="text-[15px] font-medium leading-[1.5]">{shown}</span>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 11h-6M19 8v6" />
    </svg>
  );
}
