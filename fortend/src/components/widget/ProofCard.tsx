"use client";

import { Download as DownloadIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatSource } from "@/lib/types";

interface ProofCardProps {
  source: ChatSource;
  isRevealed: boolean;
}

export function ProofCard({ source, isRevealed }: ProofCardProps) {
  // Use a generic PDF icon for all files to match the mockup
  return (
    <a
      href={`#download-${source.file}`}
      className={cn(
        "flex w-64 cursor-pointer items-center gap-3 rounded-[12px] border border-border bg-panel p-3 transition-all duration-[350ms] ease-out hover:border-border/80",
        isRevealed
          ? "translate-y-0 scale-y-100 opacity-100"
          : "origin-top -translate-y-1.5 scale-y-[.8] opacity-0"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-red-500/10">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-500"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-[13px] font-[500] text-fg">
          {source.file || "Setup-Guide.pdf"}
        </div>
        <div className="text-[11px] font-[500] text-muted">
          PDF • 1.4 MB
        </div>
      </div>
      <DownloadIcon className="h-4 w-4 text-muted transition-colors hover:text-fg" />
    </a>
  );
}
