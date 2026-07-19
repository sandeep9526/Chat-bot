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
      className="ae-stream flex flex-1 flex-col gap-4 overflow-y-auto px-[14px] py-0.5 pb-[14px]"
    >
      {isEmpty && (
        <div>
          <p className="mx-0.5 mb-3 mt-1 text-[13px] leading-[1.5] text-muted">
            {welcome}
          </p>
          <SuggestionChips onSelect={onAsk} />
        </div>
      )}

      {messages.map((msg) => (
        <AnswerEntry key={msg.id} message={msg} showSources={showSources} />
      ))}

      {isScanning && <ScanIndicator />}
    </div>
  );
}
