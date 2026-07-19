"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Composer } from "./Composer";
import { MessageStream } from "./MessageStream";
import { useZevaStore } from "@/stores/zevaStore";
import { useZevaChat } from "@/hooks/useZevaChat";
import { isLightColor } from "@/lib/color";

interface PanelProps {
  sideAlign: "start" | "end";
  openDir: "up" | "down";
  isOpen: boolean;
  onClose: () => void;
}

export function Panel({ sideAlign, openDir, isOpen, onClose }: PanelProps) {
  const name = useZevaStore((s) => s.config.name);
  const welcome = useZevaStore((s) => s.config.welcome);
  const subtitle = useZevaStore((s) => s.config.subtitle);
  const logo = useZevaStore((s) => s.config.logo);
  const panelBg = useZevaStore((s) => s.config.panelBg);
  const glass = useZevaStore((s) => s.config.glass);
  const sources = useZevaStore((s) => s.config.sources);
  const brand = useZevaStore((s) => s.config.brand);

  const { messages, ask, isScanning } = useZevaChat();
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    ask(input);
    setInput("");
  };

  // A custom panel background themes the panel's TEXT from its own brightness —
  // a dark bg gets light text, a light bg gets dark text — so the header,
  // suggestion chips and messages stay readable regardless of the page's
  // light/dark surface. Empty panelBg → inherit the page/surface theme.
  const panelLight = isLightColor(panelBg);
  const panelTheme =
    panelLight === null ? undefined : panelLight ? "light" : "dark";

  const origin =
    openDir === "up"
      ? sideAlign === "end"
        ? "origin-bottom-right"
        : "origin-bottom-left"
      : sideAlign === "end"
        ? "origin-top-right"
        : "origin-top-left";

  return (
    <div
      role="dialog"
      aria-label={`Ask ${name}`}
      aria-hidden={!isOpen}
      // Custom-bg panels carry their own theme so inner text/borders adapt to it.
      data-theme={panelTheme}
      // Collapsed panel is removed from the tab order (its form stays hidden).
      inert={!isOpen}
      className={cn(
        // text-fg pins the panel's base text colour to ITS OWN --text token, so
        // when a custom panel bg flips the panel theme, un-classed text (e.g. the
        // header name) re-inherits the panel's colour instead of the page body's.
        "text-fg",
        "flex w-full flex-col overflow-hidden h-[560px] max-h-[calc(100vh-150px)]",
        // Custom panel background (if picked) → --panel-bg var; else theme surface/glass.
        panelBg
          ? cn("bg-[var(--panel-bg)]", glass && "backdrop-blur-[20px] backdrop-saturate-[1.3]")
          : glass
            ? "bg-glass backdrop-blur-[20px] backdrop-saturate-[1.3]"
            : "bg-surface",
        "rounded-r3 border border-border shadow-panel",
        origin,
        "transition-[opacity,transform] duration-300 ease-out",
        isOpen
          ? "scale-100 translate-y-0 opacity-100"
          : "pointer-events-none h-0 max-h-0 scale-[.94] translate-y-3.5 border-0 opacity-0",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-[14px] py-[13px]">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime data URL / arbitrary logo
          <img
            src={logo}
            alt=""
            className="h-[26px] w-[26px] shrink-0 rounded-full object-cover shadow-[0_0_0_4px_var(--accent-soft)]"
          />
        ) : (
          <div className="h-[26px] w-[26px] shrink-0 rounded-full bg-gradient-to-br from-accent to-accent-strong shadow-[0_0_0_4px_var(--accent-soft)]" />
        )}
        <div className="min-w-0 flex-1">
          <b className="block text-[13.5px] font-[700] leading-tight">{name}</b>
          {subtitle && (
            <small className="font-mono text-[11px] text-faint">{subtitle}</small>
          )}
        </div>
        <button
          type="button"
          className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-[8px] border-none bg-transparent text-muted hover:bg-ring hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
          onClick={onClose}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <Composer
        name={name}
        value={input}
        isOpen={isOpen}
        onChange={setInput}
        onSubmit={handleSubmit}
      />

      <MessageStream
        messages={messages}
        isScanning={isScanning}
        welcome={welcome}
        showSources={sources}
        onAsk={ask}
      />

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-[14px] py-[9px]">
        <span className="flex items-center gap-[5px] text-[10.5px] text-faint">
          <CheckSmallIcon className="h-3 w-3 text-good" />
          Grounded in your documents
        </span>
        {brand && (
          <span className="text-[10px] text-faint">
            Powered by <b className="font-[700] text-muted">Zeva</b>
          </span>
        )}
      </div>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckSmallIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
