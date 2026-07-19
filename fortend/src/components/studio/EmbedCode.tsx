"use client";

import { useState, useCallback, useMemo } from "react";
import { buildEmbedText, buildEmbedHtml } from "@/lib/embed";
import type { ZevaConfig } from "@/lib/types";

interface EmbedCodeProps {
  config: ZevaConfig;
}

export function EmbedCode({ config }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);

  const embedText = useMemo(() => buildEmbedText(config), [config]);
  const embedHtml = useMemo(() => buildEmbedHtml(config), [config]);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(embedText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => {});
  }, [embedText]);

  return (
    <div className="mt-5 overflow-hidden rounded-[16px] border border-code-border bg-code-bg">
      <div className="flex items-center justify-between border-b border-code-border px-[15px] py-3">
        <div>
          <b className="text-[12.5px] font-[700] text-code-title">
            Your embed code
          </b>{" "}
          <span className="text-[11px] text-code-sub">
            {"\u2014 one line, updates live"}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-code-btn-border bg-code-btn px-3 py-1.5 font-ui text-[12px] font-[600] text-code-btn-fg transition-colors hover:bg-code-btn-hover focus-visible:outline-2 focus-visible:outline-accent"
          onClick={handleCopy}
        >
          <CopyIcon className="h-[13px] w-[13px]" />
          {copied ? "Copied \u2713" : "Copy"}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto px-[15px] py-[15px] font-mono text-[12px] leading-[1.7] text-code-fg">
        <code dangerouslySetInnerHTML={{ __html: embedHtml }} />
      </pre>
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
