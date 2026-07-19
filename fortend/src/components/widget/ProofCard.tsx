"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { ChatSource } from "@/lib/types";

interface ProofCardProps {
  source: ChatSource;
  isRevealed: boolean;
}

export function ProofCard({ source, isRevealed }: ProofCardProps) {
  return (
    <div
      className={cn(
        "origin-top overflow-hidden rounded-r2 border border-paper-rule bg-paper",
        "transition-all duration-[350ms] ease-out",
        isRevealed
          ? "translate-y-0 scale-y-100 opacity-100"
          : "-translate-y-1.5 scale-y-[.8] opacity-0",
      )}
    >
      {/* meta row */}
      <div className="flex items-center gap-2 border-b border-paper-rule px-[11px] py-2">
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-[600] text-muted">
          <FileIcon className="h-[13px] w-[13px] text-accent" />
          {source.file}
        </span>
        <span
          className="ml-auto flex items-center gap-[7px]"
          // The match-% is a genuine runtime value → CSS var consumed by w-[…].
          style={
            { "--match": isRevealed ? `${source.match}%` : "0%" } as CSSProperties
          }
        >
          <span className="h-[5px] w-[44px] overflow-hidden rounded-[3px] bg-ring">
            <span className="block h-full w-[var(--match)] bg-good transition-[width] delay-200 duration-[600ms] ease-out" />
          </span>
          <span className="font-mono text-[10.5px] font-[700] text-good">
            {source.match}% match
          </span>
        </span>
      </div>

      {/* ruled-paper snippet */}
      <div className="bg-[repeating-linear-gradient(var(--paper)_0_27px,var(--paper-rule)_27px_28px)] px-3 py-[11px] text-[12.5px] leading-[1.7] text-muted">
        <HighlightedSnip snip={source.snip} hi={source.highlight} />
      </div>
    </div>
  );
}

function HighlightedSnip({ snip, hi }: { snip: string; hi: string }) {
  const i = snip.indexOf(hi);
  if (i < 0) return <>{snip}</>;

  return (
    <>
      {snip.slice(0, i)}
      <mark className="box-decoration-clone rounded bg-accent-soft px-[3px] py-px font-[600] text-fg">
        {hi}
      </mark>
      {snip.slice(i + hi.length)}
    </>
  );
}

function FileIcon({ className }: { className?: string }) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
