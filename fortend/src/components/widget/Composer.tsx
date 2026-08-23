"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight as ArrowIcon } from "lucide-react";
import { useZevaStore } from "@/stores/zevaStore";

/** Mirrors the backend's MAX_MESSAGE_LEN (zeva-backend/main.py) so an
 *  over-length message is caught before it round-trips to the server. */
const MAX_MESSAGE_LEN = 1000;

interface ComposerProps {
  name: string;
  value: string;
  isOpen: boolean;
  isScanning?: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

export function Composer({
  value,
  isOpen,
  isScanning = false,
  onChange,
  onSubmit,
}: ComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRun = useRef(true);

  // Focus the input when the user opens the panel (skip the initial mount so we
  // don't steal focus / scroll on page load, matching the prototype).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="relative m-3 mt-2" onSubmit={handleSubmit} autoComplete="off">
      <input
        ref={inputRef}
        className="w-full rounded-[10px] border border-border bg-panel py-3.5 pl-4 pr-14 font-ui text-[14px] text-fg outline-none transition-colors hover:border-border/80 focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60 placeholder:text-muted"
        placeholder="Ask anything..."
        aria-label="Ask anything"
        value={value}
        maxLength={MAX_MESSAGE_LEN}
        disabled={isScanning}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="submit"
        className="tap absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[8px] border-none bg-accent text-fg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent-ring disabled:cursor-not-allowed disabled:opacity-35"
        disabled={!value.trim() || isScanning}
        aria-label="Ask"
      >
        <ArrowIcon className="h-[18px] w-[18px]" strokeWidth={2.5} />
      </button>
      {value.length > MAX_MESSAGE_LEN * 0.8 && (
        <div className="mt-1 pr-1 text-right font-mono text-[10px] text-faint">
          {value.length}/{MAX_MESSAGE_LEN}
        </div>
      )}
    </form>
  );
}

interface SuggestionChipsProps {
  onSelect: (q: string) => void;
}

/** Generic suggestions shown when a website URL is provided */
const GENERIC_SUGGESTIONS = [
  "What services do you offer?",
  "What are your prices?",
  "Where are you located?",
  "What are your working hours?",
  "How can I contact you?",
];

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const configuredSuggestions = useZevaStore((s) => s.config.suggestions);

  // Use configured template suggestions if present, otherwise fallback to generic
  const suggestions =
    configuredSuggestions && configuredSuggestions.length > 0
      ? configuredSuggestions
      : GENERIC_SUGGESTIONS;
  const chips = suggestions.map((q) => q.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1">
      {chips.map((q, i) => (
        <button
          key={`${i}-${q}`}
          type="button"
          className="flex cursor-pointer items-center rounded-full border border-border bg-transparent px-3.5 py-1.5 font-ui text-[12.5px] font-[500] text-muted transition-colors hover:border-accent hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
