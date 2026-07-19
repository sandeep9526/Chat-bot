"use client";

import { useEffect, useRef, useState } from "react";

const SNIPPET = `<script
  src="https://cdn.zeva.app/widget.js"
  data-bot-id="acme-salon"
  data-accent="#4f46e5"
  data-corners="soft"
  data-launcher="pill"
></script>`;

/**
 * The one-line embed, type-writing itself in when it scrolls into view, with a
 * copy button + confirmation. Respects reduced motion (shows the full snippet
 * immediately) and never traps content behind JS.
 */
export function CopyEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        if (reduce) {
          setTyped(SNIPPET);
          setDone(true);
          return;
        }
        let i = 0;
        const step = () => {
          i += Math.random() > 0.85 ? 2 : 1; // slight human jitter
          setTyped(SNIPPET.slice(0, i));
          if (i < SNIPPET.length) {
            timer = setTimeout(step, 14);
          } else {
            setTyped(SNIPPET);
            setDone(true);
          }
        };
        step();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-r3 border border-code-border bg-code-bg shadow-panel"
    >
      <div className="flex items-center justify-between border-b border-code-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-[11px] text-code-sub">
            index.html
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="rounded-r1 border border-code-btn-border bg-code-btn px-3 py-1.5 font-mono text-[11.5px] font-[650] text-code-btn-fg transition-colors hover:bg-code-btn-hover"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-code-fg">
        <code className={done ? "" : "type-caret"}>{typed}</code>
      </pre>
    </div>
  );
}
