"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { AdminBot } from "@/lib/adminApi";
import { markSetupDone } from "@/lib/setupProgress";
import { CopyIcon, CheckIcon } from "./panelIcons";
import { buildEmbedRows } from "@/lib/embed";
import type { ZevaConfig } from "@/lib/types";
import { DEFAULTS } from "@/lib/defaults";

const WIDGET_SRC = "https://www.ochreshift.app/widget.js";

export type PlatformKey = "html" | "wordpress" | "shopify" | "react" | "vue" | "angular";

export const PLATFORMS: { key: PlatformKey; label: string; icon: React.ReactNode; color: string }[] = [
  {
    key: "html",
    label: "HTML",
    color: "group-hover:text-orange-500",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm17.09 4.163L4.93 4.17l.224 2.498h13.204l-.236 2.65H5.385l.225 2.51h12.56l-.68 7.62-5.49 1.52-5.505-1.52-.35-3.92H3.636L4.2 19.33l7.77 2.164 7.78-2.16 1.15-12.875.09-1.04-.3-2.25z" /></svg>
  },
  {
    key: "wordpress",
    label: "WordPress",
    color: "group-hover:text-blue-500",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.213 23.365C5.972 23.365.922 18.283.922 12c0-6.282 5.05-11.365 11.29-11.365 6.241 0 11.291 5.083 11.291 11.365 0 6.282-5.05 11.365-11.29 11.365zM.213 12C.213 5.372 5.586 0 12.213 0s12 5.372 12 12-5.373 12-12 12-12-5.372-12-12zm6.273-1.636l2.87 8.328 2.87-8.328H6.486zm5.74 0h5.741l-2.87 8.328-2.87-8.328zm5.741-2.046c.928 0 1.683-.755 1.683-1.683s-.755-1.683-1.683-1.683-1.683.755-1.683 1.683.755 1.683 1.683 1.683z" /></svg>
  },
  {
    key: "shopify",
    label: "Shopify",
    color: "group-hover:text-green-500",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M18.8 2.3c-.6-.3-1.3-.3-2-.1-.6.2-1.2.6-1.5 1.1-.3.5-.4 1.1-.3 1.7.1.6.4 1.1.8 1.5L19.7 9v13H4.3V9l3.9-2.5c.5-.4.8-1 .8-1.5.1-.6-.1-1.3-.3-1.7-.3-.5-.8-1-1.5-1.1-.6-.2-1.3-.1-2 .1-.6.3-1.1.7-1.4 1.3L1.5 8.1 3 24h18l1.5-15.9-2.3-4.5c-.3-.6-.8-1-1.4-1.3zm-5.4 9.1v8c0 1.9-1.4 3.4-3.4 3.4-1.9 0-3.4-1.5-3.4-3.4v-8c0-.4.3-.8.8-.8s.8.3.8.8v8c0 1 .8 1.8 1.8 1.8 1 0 1.8-.8 1.8-1.8v-8c0-.4.3-.8.8-.8s.8.3.8.8z" /></svg>
  },
  {
    key: "react",
    label: "React",
    color: "group-hover:text-blue-400",
    icon: <svg viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor" className="w-6 h-6"><circle cx="0" cy="0" r="2.05" /><g stroke="currentColor" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2" /><ellipse rx="11" ry="4.2" transform="rotate(60)" /><ellipse rx="11" ry="4.2" transform="rotate(120)" /></g></svg>
  },
  {
    key: "vue",
    label: "Vue",
    color: "group-hover:text-emerald-500",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z" /></svg>
  },
  {
    key: "angular",
    label: "Angular",
    color: "group-hover:text-red-500",
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 0L.49 4.1L2.24 17.14L12 24L21.76 17.14L23.51 4.1L12 0ZM12 2.6L20.89 5.67L19.46 16.32L12 22.04L4.54 16.32L3.11 5.67L12 2.6ZM12 4L5.61 18H7.4L8.71 14.6H15.29L16.6 18H18.39L12 4ZM12 7.15L14.54 13.06H9.46L12 7.15Z" /></svg>
  },
];

export const WHERE_TO_PASTE: Record<PlatformKey, string[]> = {
  html: [
    "Open your site's main HTML file.",
    "Paste the snippet just before the closing </body> tag.",
    "Publish. The chat launcher appears bottom-right on every page it loads on.",
  ],
  wordpress: [
    "Go to Dashboard → Appearance → Theme File Editor → footer.php (or use WPCode plugin).",
    "Paste the snippet just before </body> (or into the plugin's “Footer” box).",
    "Save. It now shows on every page — no per-page edits needed.",
  ],
  shopify: [
    "Go to Online Store → Themes → ⋯ → Edit code.",
    "Open Layout → theme.liquid.",
    "Paste the snippet just before </body> and Save.",
  ],
  react: [
    "Open your root layout (app/layout.tsx in Next.js, or App.tsx in plain React).",
    "Add the <Script> component below.",
    "In plain React (no Next.js), use the useEffect variant shown in the comment.",
  ],
  vue: [
    "Open your app entry file — src/main.js (or src/main.ts).",
    "Add the injection below, after createApp(...).mount(...).",
    "The id guard stops a second widget from mounting during hot-reload.",
  ],
  angular: [
    "Open src/app/app.component.ts.",
    "Implement OnInit and add the injection below.",
    "The id guard stops a second widget from mounting on re-init.",
  ],
};

function scriptSnippet(bot: AdminBot): string {
  const cfg: ZevaConfig = bot.design && "config" in bot.design && (bot.design as { config: ZevaConfig }).config
    ? (bot.design as { config: ZevaConfig }).config
    : { ...DEFAULTS, name: bot.name, accent: bot.accent };
  const rows = buildEmbedRows(cfg, bot.bot_id);
  return [
    "<script",
    `  src="${WIDGET_SRC}"`,
    ...rows.map(([k, v]) => {
      const displayVal = v.startsWith("data:") && v.length > 55 ? v.slice(0, 32) + "...(base64)" : v;
      return `  data-${k}="${displayVal}"`;
    }),
    "  async></script>",
  ].join("\n");
}


function reactSnippet(bot: AdminBot): string {
  const cfg: ZevaConfig = bot.design && "config" in bot.design && (bot.design as { config: ZevaConfig }).config
    ? (bot.design as { config: ZevaConfig }).config
    : { ...DEFAULTS, name: bot.name, accent: bot.accent };
  const rows = buildEmbedRows(cfg, bot.bot_id);
  const dataAttrs = rows.map(([k, v]) => {
    const displayVal = v.startsWith("data:") && v.length > 55 ? v.slice(0, 32) + "...(base64)" : v;
    return `  data-${k}="${displayVal}"`;
  }).join("\n");
  return [
    "// Next.js — app/layout.tsx. Loads once, after the page is interactive.",
    'import Script from "next/script";',
    "",
    "<Script",
    `  src="${WIDGET_SRC}"`,
    dataAttrs,
    '  strategy="afterInteractive"',
    "/>",
    "",
    "// Plain React (no Next.js) — drop this into your top-level App component:",
    "// useEffect(() => {",
    '//   if (document.getElementById("ochreshift-widget")) return;',
    '//   const s = document.createElement("script");',
    '//   s.id = "ochreshift-widget";',
    `//   s.src = "${WIDGET_SRC}";`,
    "//   s.async = true;",
    ...rows.map(([k, v]) => `//   s.setAttribute("data-${k}", "${v.startsWith("data:") && v.length > 55 ? v.slice(0, 32) + "...(base64)" : v}");`),
    "//   document.body.appendChild(s);",
    "// }, []);",
  ].join("\n");
}

function vueSnippet(bot: AdminBot): string {
  const cfg: ZevaConfig = bot.design && "config" in bot.design && (bot.design as { config: ZevaConfig }).config
    ? (bot.design as { config: ZevaConfig }).config
    : { ...DEFAULTS, name: bot.name, accent: bot.accent };
  const rows = buildEmbedRows(cfg, bot.bot_id);
  return [
    "// src/main.js — Vue app entry. Injects the ochreshift widget once, after mount.",
    'import { createApp } from "vue";',
    'import App from "./App.vue";',
    "",
    'createApp(App).mount("#app");',
    "",
    'if (!document.getElementById("ochreshift-widget")) {',
    '  const s = document.createElement("script");',
    '  s.id = "ochreshift-widget";',
    `  s.src = "${WIDGET_SRC}";`,
    "  s.async = true;",
    ...rows.map(([k, v]) => {
      const displayVal = v.startsWith("data:") && v.length > 55 ? v.slice(0, 32) + "...(base64)" : v;
      return `  s.setAttribute("data-${k}", "${displayVal}");`;
    }),
    "  document.body.appendChild(s);",
    "}",
  ].join("\n");
}

function angularSnippet(bot: AdminBot): string {
  const cfg: ZevaConfig = bot.design && "config" in bot.design && (bot.design as { config: ZevaConfig }).config
    ? (bot.design as { config: ZevaConfig }).config
    : { ...DEFAULTS, name: bot.name, accent: bot.accent };
  const rows = buildEmbedRows(cfg, bot.bot_id);
  return [
    "// src/app/app.component.ts — inject the ochreshift widget once on init.",
    'import { Component, OnInit } from "@angular/core";',
    "",
    "@Component({ selector: \"app-root\", templateUrl: \"./app.component.html\" })",
    "export class AppComponent implements OnInit {",
    "  ngOnInit(): void {",
    '    if (document.getElementById("ochreshift-widget")) return;',
    '    const s = document.createElement("script");',
    '    s.id = "ochreshift-widget";',
    `    s.src = "${WIDGET_SRC}";`,
    "    s.async = true;",
    ...rows.map(([k, v]) => {
      const displayVal = v.startsWith("data:") && v.length > 55 ? v.slice(0, 32) + "...(base64)" : v;
      return `    s.setAttribute("data-${k}", "${displayVal}");`;
    }),
    "    document.body.appendChild(s);",
    "  }",
    "}",
  ].join("\n");
}

export const SNIPPET_BUILDERS: Record<PlatformKey, (bot: AdminBot) => string> = {
  html: scriptSnippet,
  wordpress: scriptSnippet,
  shopify: scriptSnippet,
  react: reactSnippet,
  vue: vueSnippet,
  angular: angularSnippet,
};

export const FILE_LABEL: Record<PlatformKey, string> = {
  html: "index.html",
  wordpress: "footer.php",
  shopify: "theme.liquid",
  react: "app/layout.tsx",
  vue: "src/main.js",
  angular: "app.component.ts",
};

// HTML-escape helper — MUST run before injecting syntax-highlighting spans
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Syntax highlighting for the snippet code box
export const highlightSnippet = (code: string) => {
  return code
    .split("\n")
    .map((line, i) => {
      // 1. HTML-escape the raw line first so <script> etc. render as text
      let h = esc(line);
      // 2. Apply highlighting on the escaped text
      h = h
        .replace(/(&lt;\/?script.*?&gt;)/g, "<span class='text-blue-400'>$1</span>")           // <script> / </script>
        .replace(/(&lt;Script)/g, "<span class='text-blue-400'>$1</span>")                     // <Script (JSX)
        .replace(/(\/?&gt;)/g, "<span class='text-blue-400'>$1</span>")                        // /> or >
        .replace(/("[^"]*")/g, "<span class='text-emerald-400'>$1</span>")                     // strings
        .replace(/(data-[\w-]+)=/g, "<span class='text-purple-400'>$1</span>=")                // data-* attrs
        .replace(/(strategy|src|async)=/g, "<span class='text-purple-400'>$1</span>=")         // other attrs
        .replace(/(\/\/.*)/g, "<span class='text-gray-500'>$1</span>")                        // JS comments
        .replace(/(import |from |const |if |return )/g, "<span class='text-blue-400'>$1</span>") // keywords
        .replace(/(\.setAttribute|\.createElement|\.getElementById|\.appendChild|\.mount)/g, "<span class='text-yellow-300'>$1</span>"); // methods
      return <div key={i} dangerouslySetInnerHTML={{ __html: h || " " }} />;
    });
};

export function InstallCard({ bot }: { bot: AdminBot }) {
  const [platform, setPlatform] = useState<PlatformKey>("html");
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => SNIPPET_BUILDERS[platform](bot), [platform, bot]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      markSetupDone(bot.bot_id, "install");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (e.g. insecure context)
    }
  };

  return (
    <div className="w-full mx-auto animate-fade-in">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-[800] tracking-tight bg-gradient-to-r from-fg to-muted bg-clip-text text-transparent">
          Install your agent
        </h2>
        <p className="text-[14px] text-muted max-w-2xl">
          Integrate the chat widget into your website. Choose your platform below for tailored instructions, or use the standard HTML snippet anywhere.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration & Steps */}
        <div className="lg:col-span-5 flex flex-col gap-8">

          {/* Platform Grid */}
          <div>
            <h3 className="text-[13px] font-[700] text-fg uppercase tracking-wider mb-4">1. Select Platform</h3>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map((p) => {
                const isActive = platform === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setPlatform(p.key)}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-300",
                      isActive
                        ? "border-accent bg-accent/5 shadow-[0_0_20px_-5px_rgba(var(--accent-rgb),0.3)] ring-1 ring-accent/20"
                        : "border-border bg-surface hover:bg-surface-hover hover:border-border-strong hover:-translate-y-0.5 shadow-sm"
                    )}
                  >
                    <div className={cn("transition-colors duration-300", isActive ? "text-accent" : "text-muted group-hover:text-fg " + p.color)}>
                      {p.icon}
                    </div>
                    <span className={cn("text-[12px] font-[650] transition-colors", isActive ? "text-accent" : "text-fg")}>
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline Steps */}
          <div>
            <h3 className="text-[13px] font-[700] text-fg uppercase tracking-wider mb-4">2. Follow Instructions</h3>
            <div className="relative border-l border-border/80 ml-3.5 pl-6 space-y-6 py-2">
              {WHERE_TO_PASTE[platform].map((step, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-[750] text-white ring-4 ring-bg shadow-sm">
                    {i + 1}
                  </div>
                  <p className="text-[13.5px] text-fg leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Callout */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 items-start mt-auto">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" /><path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="8" r="1" fill="currentColor" /></svg>
            <div className="text-[12px] text-blue-500/90 leading-relaxed">
              Only visitors on domains you allow will get answers — set those under <strong>Settings → Allowed domains</strong>. The snippet is safe to commit to your site's code; it contains no secret keys.
            </div>
          </div>

        </div>

        {/* Right Column: IDE Snippet Window */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0F111A]">

            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1A1D27] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
              </div>
              <div className="font-mono text-[11.5px] text-white/50 absolute left-1/2 -translate-x-1/2">
                {FILE_LABEL[platform]}
              </div>
              <button
                type="button"
                onClick={copy}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-[600] transition-all duration-300",
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-3.5 w-3.5" /> Copy code
                  </>
                )}
              </button>
            </div>

            {/* Window Body (Code) */}
            <div className="relative group">
              <pre className="p-6 overflow-auto min-h-[300px] max-h-[450px] custom-scrollbar">
                <code className="font-mono text-[13px] leading-[1.7] text-[#A6ACCD]">
                  {highlightSnippet(snippet)}
                </code>
              </pre>

              {/* Overlay hover effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F111A]/50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
