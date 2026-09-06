"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/cn";

interface FormattedMessageProps {
  text: string;
  className?: string;
  isUser?: boolean;
}

type InlineToken =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "code"; content: string }
  | { type: "italic"; content: string }
  | { type: "link"; content: string; url: string };

function parseInlineTokens(text: string): InlineToken[] {
  if (!text) return [];
  const tokens: InlineToken[] = [];
  // Match links [text](url), bold (**...**), inline code (`...`), or italic (*...*)
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined && match[3] !== undefined) {
      tokens.push({ type: "link", content: match[2], url: match[3] });
    } else if (match[4] !== undefined) {
      tokens.push({ type: "bold", content: match[4] });
    } else if (match[5] !== undefined) {
      tokens.push({ type: "code", content: match[5] });
    } else if (match[6] !== undefined) {
      tokens.push({ type: "italic", content: match[6] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", content: text.slice(lastIndex) });
  }

  return tokens;
}

function renderInline(text: string, isUser?: boolean): React.ReactNode {
  const tokens = parseInlineTokens(text);
  if (tokens.length === 0) return null;

  return tokens.map((tok, idx) => {
    switch (tok.type) {
      case "bold":
        return (
          <strong
            key={idx}
            className={cn(
              "font-[750] tracking-tight",
              isUser ? "text-white font-bold" : "text-fg font-bold"
            )}
          >
            {tok.content}
          </strong>
        );
      case "link":
        return (
          <a
            key={idx}
            href={tok.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline decoration-accent/40 underline-offset-2 hover:decoration-accent transition-colors font-[550]",
              isUser ? "text-white" : "text-accent"
            )}
          >
            {tok.content}
          </a>
        );
      case "code":
        return (
          <code
            key={idx}
            className={cn(
              "font-mono text-[12px] px-1.5 py-0.5 rounded border shadow-xs",
              isUser
                ? "bg-white/20 text-white border-white/20"
                : "bg-surface text-accent font-semibold border-border/50"
            )}
          >
            {tok.content}
          </code>
        );
      case "italic":
        return (
          <em key={idx} className="italic opacity-90">
            {tok.content}
          </em>
        );
      default:
        return <React.Fragment key={idx}>{tok.content}</React.Fragment>;
    }
  });
}

type Block =
  | { type: "header"; text: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "ordered_list"; items: string[] }
  | { type: "paragraph"; lines: string[] };

export function FormattedMessage({ text, className, isUser = false }: FormattedMessageProps) {
  const blocks = useMemo(() => {
    if (!text) return [];

    const rawLines = text.split("\n");
    const parsedBlocks: Block[] = [];
    let currentList: { type: "bullet_list" | "ordered_list"; items: string[] } | null = null;
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        parsedBlocks.push({ type: "paragraph", lines: [...currentParagraph] });
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList) {
        parsedBlocks.push(currentList);
        currentList = null;
      }
    };

    for (const rawLine of rawLines) {
      const line = rawLine.trim();

      // Empty line -> flush list or paragraph
      if (!line) {
        flushList();
        flushParagraph();
        continue;
      }

      // Headers (#, ##, ###)
      const headerMatch = line.match(/^#{1,3}\s+(.*)$/);
      if (headerMatch) {
        flushList();
        flushParagraph();
        parsedBlocks.push({ type: "header", text: headerMatch[1] });
        continue;
      }

      // Numbered step lists (1. , 1) , **1.** , **Step 1:**)
      const numMatch = line.match(/^(\d+[\.\)]|\*\*\d+[\.\)]\*\*|\*\*Step\s*\d+:?\*\*)\s*(.*)$/i);
      if (numMatch) {
        flushParagraph();
        if (!currentList || currentList.type !== "ordered_list") {
          flushList();
          currentList = { type: "ordered_list", items: [] };
        }
        // Normalize line content
        const itemContent = numMatch[2] ? numMatch[2] : line.replace(/^(\d+[\.\)]|\*\*\d+[\.\)]\*\*|\*\*Step\s*\d+:?\*\*)\s*/i, "");
        currentList.items.push(itemContent);
        continue;
      }

      // Bullet lists (- , * , • )
      const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
      if (bulletMatch) {
        flushParagraph();
        if (!currentList || currentList.type !== "bullet_list") {
          flushList();
          currentList = { type: "bullet_list", items: [] };
        }
        currentList.items.push(bulletMatch[1]);
        continue;
      }

      // Standalone emoji + bold heading (e.g. 🔍 **Inspect Design Details Instantly**)
      if (/^[\p{Emoji}\u200d\uFE0F]+\s+\*\*[^*]+\*\*$/u.test(line) || /^\*\*[^*]+\*\*:?$/.test(line)) {
        flushList();
        flushParagraph();
        parsedBlocks.push({ type: "header", text: line });
        continue;
      }

      // Regular line in paragraph
      flushList();
      currentParagraph.push(line);
    }

    flushList();
    flushParagraph();

    return parsedBlocks;
  }, [text]);

  if (!text) return null;

  return (
    <div className={cn("space-y-3 text-[14px] leading-[1.68]", className)}>
      {blocks.map((block, bIdx) => {
        if (block.type === "header") {
          return (
            <div
              key={bIdx}
              className={cn(
                "font-[750] text-[14.5px] mt-2.5 mb-1 tracking-tight flex items-center gap-1.5",
                isUser ? "text-white" : "text-fg"
              )}
            >
              {renderInline(block.text, isUser)}
            </div>
          );
        }

        if (block.type === "bullet_list") {
          return (
            <ul key={bIdx} className="my-2 space-y-2 pl-0.5 list-none">
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2.5 text-[13.5px] leading-[1.65]">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full mt-2.5 shrink-0 shadow-xs",
                      isUser ? "bg-white" : "bg-accent"
                    )}
                  />
                  <div className="flex-1 min-w-0">{renderInline(item, isUser)}</div>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered_list") {
          return (
            <ol key={bIdx} className="my-2.5 space-y-2.5 pl-0.5 list-none">
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2.5 text-[13.5px] leading-[1.65]">
                  <span
                    className={cn(
                      "flex items-center justify-center h-[20px] w-[20px] rounded-full text-[11px] font-[800] mt-0.5 shrink-0 shadow-xs",
                      isUser ? "bg-white/20 text-white" : "bg-accent/15 text-accent border border-accent/25"
                    )}
                  >
                    {iIdx + 1}
                  </span>
                  <div className="flex-1 min-w-0">{renderInline(item, isUser)}</div>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={bIdx} className="m-0 text-[14px]">
            {block.lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInline(line, isUser)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
