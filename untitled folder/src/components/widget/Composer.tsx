"use client";

import { useEffect, useRef } from "react";
import { Sparkle as SparkSmallIcon, Sparkle as CrosshairIcon, ArrowRight as ArrowIcon, CornerDownLeft } from "lucide-react";
import { useZevaStore } from "@/stores/zevaStore";

interface ComposerProps {
  name: string;
  value: string;
  isOpen: boolean;
  isScanning?: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

export function Composer({
  name,
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
    <form className="relative m-3" onSubmit={handleSubmit} autoComplete="off">
      <span className="absolute left-3 top-1/2 grid -translate-y-1/2 place-items-center text-accent">
        <CrosshairIcon className="h-4 w-4" />
      </span>
      <input
        ref={inputRef}
        className="w-full rounded-r2 border border-border bg-surface py-3 pl-[38px] pr-11 font-ui text-[14px] text-fg outline-none focus:border-accent focus:ring-4 focus:ring-accent-ring disabled:opacity-60"
        placeholder={`Ask anything about ${name}…`}
        aria-label={`Ask anything about ${name}`}
        value={value}
        disabled={isScanning}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="submit"
        className="tap absolute right-[7px] top-1/2 grid h-[30px] w-[30px] -translate-y-1/2 place-items-center rounded-r1 border-none bg-accent text-[var(--on-accent)] outline-none focus-visible:ring-2 focus-visible:ring-accent-ring disabled:cursor-not-allowed disabled:opacity-35"
        disabled={!value.trim() || isScanning}
        aria-label="Ask"
      >
        <ArrowIcon className="h-4 w-4" />
      </button>
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
    <div className="flex flex-col gap-[7px]">
      {chips.map((q, i) => (
        <button
          key={`${i}-${q}`}
          type="button"
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-r1 border border-border bg-surface px-[11px] py-[9px] text-left font-ui text-[13px] text-fg transition-[border-color,transform] duration-100 hover:translate-x-0.5 hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
          onClick={() => onSelect(q)}
        >
          <SparkSmallIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
          {q}
          <span className="ml-auto grid place-items-center rounded-[5px] border border-border px-[5px] py-px text-faint">
            <CornerDownLeft className="h-2.5 w-2.5" />
          </span>
        </button>
      ))}
    </div>
  );
}
