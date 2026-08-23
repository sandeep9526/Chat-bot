"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle as WarningIcon, UserPlus as UserPlusIcon, RotateCcw as RetryIcon } from "lucide-react";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
import { ProofCard } from "./ProofCard";
import { LeadTicket, LeadStub } from "./LeadTicket";
import { useZevaStore } from "@/stores/zevaStore";
import type { ChatMessage } from "@/lib/types";

interface AnswerEntryProps {
  message: ChatMessage;
  showSources: boolean;
  onRetry?: (text: string) => void;
}

export function AnswerEntry({ message, showSources, onRetry }: AnswerEntryProps) {
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
      <div className="max-w-[85%] self-end rounded-[12px] rounded-br-[4px] bg-panel px-4 py-2.5 text-[14px] font-[500] text-fg shadow-sm border border-border">
        {message.text}
      </div>
    );
  }

  // Assistant answer.
  const showProof = showSources && hasSource;

  return (
    <div>
    <div className="pl-[38px] relative">
      <div className="absolute left-0 top-0 h-[28px] w-[28px] shrink-0 rounded-full bg-surface border border-border shadow-sm flex items-center justify-center p-[4px]">
        {message.isError ? (
          <WarningIcon className="h-full w-full text-amber-500" />
        ) : (
          <OchreshiftLogo className="h-full w-full" variant="mark" />
        )}
      </div>
      <div className="pt-0.5">
        <TypewriterText text={message.text} />
      </div>
    </div>

      {/* Failed request: distinct from a real answer, with a way to retry. */}
      {message.isError && (
        <div role="alert" className="mt-3">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-[7px] rounded-r1 border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-ui text-[12.5px] font-[600] text-amber-600 transition-colors hover:border-amber-500 focus-visible:outline-2 focus-visible:outline-accent dark:text-amber-400"
            onClick={() => message.retryText && onRetry?.(message.retryText)}
            disabled={!message.retryText || !onRetry}
          >
            <RetryIcon className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Guardrail: no matching source. */}
      {message.isGuardrail && !message.limitReached && (
        <div role="status" className="mt-3 flex items-center gap-2.5 rounded-r2 border border-dashed border-border px-3 py-2.5 text-[12.5px] text-muted">
          <WarningIcon className="h-4 w-4 shrink-0 text-amber-500" />
          I couldn&rsquo;t find that in our docs — connecting you with our team.
        </div>
      )}

      {/* Quota / inactive-subscription / other business-side pause. The specific
          reason is already in the answer text above (from the backend); this
          banner stays generic so it never conflicts with or duplicates that copy. */}
      {message.limitReached && (
        <div role="alert" className="mt-3.5 flex items-center gap-2.5 rounded-r2 border border-amber-500/40 bg-amber-500/10 px-3.5 py-3 text-[12.5px] font-[600] text-amber-600 dark:text-amber-400">
          <WarningIcon className="h-4 w-4 shrink-0 text-amber-500" />
          <span>This assistant is temporarily unavailable — leave your details below and we&rsquo;ll follow up.</span>
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
            Leave your details
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
          <LeadStub />
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
