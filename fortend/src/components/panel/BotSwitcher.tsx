"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { AdminBot } from "@/lib/adminApi";
import { ChevronDownIcon, CheckIcon, PlusIcon } from "./panelIcons";

interface BotSwitcherProps {
  bots: AdminBot[];
  activeBotId: string;
  onSelect: (botId: string) => void;
  /** Called when the user picks "New bot". */
  onCreate?: () => void;
}

/**
 * Workspace/bot switcher for the top bar. A custom popover (not a native
 * <select>) so each option can show its brand accent dot — the same pattern
 * Chatbase/Intercom use to make the active workspace unmistakable.
 */
export function BotSwitcher({ bots, activeBotId, onSelect, onCreate }: BotSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = bots.find((b) => b.bot_id === activeBotId);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (bots.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="tap flex max-w-[200px] items-center gap-2 rounded-r1 border border-border bg-surface px-2.5 py-1.5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: active?.accent || "var(--accent)" }}
        />
        <span className="truncate text-[13px] font-[650] text-fg">
          {active?.name || "Select bot"}
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-faint" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 max-h-[60vh] w-64 overflow-y-auto rounded-r2 border border-border bg-surface p-1.5 shadow-panel"
        >
          <div className="px-2.5 py-1.5 text-[10.5px] font-[700] uppercase tracking-[.12em] text-faint">
            Your bots
          </div>
          {bots.map((b) => {
            const selected = b.bot_id === activeBotId;
            return (
              <button
                key={b.bot_id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onSelect(b.bot_id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-r1 px-2.5 py-2 text-left transition-colors",
                  selected ? "bg-accent-soft" : "hover:bg-panel",
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: b.accent }}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[13px] font-[650]",
                      selected ? "text-accent" : "text-fg",
                    )}
                  >
                    {b.name}
                  </span>
                  <span className="block truncate font-mono text-[10.5px] text-faint">
                    {b.bot_id}
                  </span>
                </span>
                {selected && <CheckIcon className="h-4 w-4 shrink-0 text-accent" />}
              </button>
            );
          })}
          {onCreate && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  onCreate();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-r1 px-2.5 py-2 text-left text-[13px] font-[600] text-muted hover:bg-panel hover:text-fg"
              >
                <PlusIcon className="h-4 w-4" />
                New bot
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
