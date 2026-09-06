"use client";

import { useEffect, useRef } from "react";
import { ScanIndicator } from "./ScanIndicator";
import { AnswerEntry } from "./AnswerEntry";
import { SuggestionChips } from "./Composer";
import type { ChatMessage } from "@/lib/types";

interface MessageStreamProps {
  messages: ChatMessage[];
  isScanning: boolean;
  welcome: string;
  showSources: boolean;
  onAsk: (q: string) => void;
}

export function MessageStream({
  messages,
  isScanning,
  welcome,
  showSources,
  onAsk,
}: MessageStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest content as it streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, isScanning]);

  const isEmpty = messages.length === 0 && !isScanning;

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className="ae-stream flex flex-1 flex-col gap-3.5 overflow-y-auto px-[14px] py-3 pb-2 custom-scrollbar"
    >
      {isEmpty && (
        <div className="flex flex-col gap-2.5">
          <div className="rounded-2xl rounded-tl-sm bg-panel/70 border border-border/60 p-3.5 shadow-xs">
            <p className="text-[13px] leading-[1.55] text-fg">
              {welcome}
            </p>
          </div>
          <SuggestionChips onSelect={onAsk} />
        </div>
      )}

      {messages.map((msg) => (
        <AnswerEntry
          key={msg.id}
          message={msg}
          showSources={showSources}
          onRetry={onAsk}
        />
      ))}

      {isScanning && <ScanIndicator />}
    </div>
  );
}
