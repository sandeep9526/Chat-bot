"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { AdminBot } from "@/lib/adminApi";
import { markSetupDone } from "@/lib/setupProgress";
import { CopyIcon, CheckIcon } from "./panelIcons";
import { buildEmbedRows } from "@/lib/embed";
import type { ZevaConfig } from "@/lib/types";
import { DEFAULTS } from "@/lib/defaults";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const WIDGET_SRC = "https://cdn.zeva.app/widget.js";

type PlatformKey = "html" | "wordpress" | "shopify" | "react" | "vue" | "angular";

const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: "html", label: "HTML / any site" },
  { key: "wordpress", label: "WordPress" },
  { key: "shopify", label: "Shopify" },
  { key: "react", label: "React / Next.js" },
  { key: "vue", label: "Vue" },
  { key: "angular", label: "Angular" },
];

const WHERE_TO_PASTE: Record<PlatformKey, string[]> = {
  html: [
    "Open your site's main HTML file.",
    "Paste the snippet just before the closing </body> tag.",
    "Publish. The chat launcher appears bottom-right on every page it loads on.",
  ],
  wordpress: [
    "Dashboard → Appearance → Theme File Editor → footer.php (or install the free “WPCode / Insert Headers and Footers” plugin).",
    "Paste the snippet just before </body> (or into the plugin's “Footer” box).",
    "Save. It now shows on every page — no per-page edits needed.",
  ],
  shopify: [
    "Online Store → Themes → ⋯ → Edit code.",
    "Open Layout → theme.liquid.",
    "Paste the snippet just before </body> and Save.",
  ],
  react: [
    "Open your root layout (app/layout.tsx in Next.js, or App.tsx in plain React).",
    "Add the <Script> below — it loads once, after the page is interactive, and isn't re-injected on re-render.",
    "In plain React (no Next.js), use the useEffect variant shown in the comment.",
  ],
  vue: [
    "Open your app entry file — src/main.js (or src/main.ts).",
    "Add the injection below, after createApp(...).mount(...). It runs once when the app boots.",
    "The id guard stops a second widget from mounting during hot-reload.",
  ],
  angular: [
    "Open src/app/app.component.ts.",
    "Implement OnInit and add the injection below — it runs once when the root component loads.",
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
    ...rows.map(([k, v]) => `  data-${k}="${v}"`),
    "  async></script>",
  ].join("\n");
}

function reactSnippet(bot: AdminBot): string {
  return [
    "// Next.js — app/layout.tsx. Loads once, after the page is interactive.",
    'import Script from "next/script";',
    "",
    "<Script",
    `  src="${WIDGET_SRC}"`,
    `  data-bot-id="${bot.bot_id}"`,
    `  data-name="${bot.name}"`,
    `  data-accent="${bot.accent.toLowerCase()}"`,
    `  data-api-url="${API_URL}"`,
    '  strategy="afterInteractive"',
    "/>",
    "",
    "// Plain React (no Next.js) — drop this into your top-level App component:",
    "// useEffect(() => {",
    '//   if (document.getElementById("zeva-widget")) return;',
    '//   const s = document.createElement("script");',
    '//   s.id = "zeva-widget";',
    `//   s.src = "${WIDGET_SRC}";`,
    "//   s.async = true;",
    `//   s.dataset.botId = "${bot.bot_id}";`,
    `//   s.dataset.name = "${bot.name}";`,
    `//   s.dataset.accent = "${bot.accent.toLowerCase()}";`,
    `//   s.dataset.apiUrl = "${API_URL}";`,
    "//   document.body.appendChild(s);",
    "// }, []);",
  ].join("\n");
}

function vueSnippet(bot: AdminBot): string {
  return [
    "// src/main.js — Vue app entry. Injects the Zeva widget once, after mount.",
    'import { createApp } from "vue";',
    'import App from "./App.vue";',
    "",
    'createApp(App).mount("#app");',
    "",
    'if (!document.getElementById("zeva-widget")) {',
    '  const s = document.createElement("script");',
    '  s.id = "zeva-widget";',
    `  s.src = "${WIDGET_SRC}";`,
    "  s.async = true;",
    `  s.dataset.botId = "${bot.bot_id}";`,
    `  s.dataset.name = "${bot.name}";`,
    `  s.dataset.accent = "${bot.accent.toLowerCase()}";`,
    `  s.dataset.apiUrl = "${API_URL}";`,
    "  document.body.appendChild(s);",
    "}",
  ].join("\n");
}

function angularSnippet(bot: AdminBot): string {
  return [
    "// src/app/app.component.ts — inject the Zeva widget once on init.",
    'import { Component, OnInit } from "@angular/core";',
    "",
    "@Component({ selector: \"app-root\", templateUrl: \"./app.component.html\" })",
    "export class AppComponent implements OnInit {",
    "  ngOnInit(): void {",
    '    if (document.getElementById("zeva-widget")) return;',
    '    const s = document.createElement("script");',
    '    s.id = "zeva-widget";',
    `    s.src = "${WIDGET_SRC}";`,
    "    s.async = true;",
    `    s.setAttribute("data-bot-id", "${bot.bot_id}");`,
    `    s.setAttribute("data-name", "${bot.name}");`,
    `    s.setAttribute("data-accent", "${bot.accent.toLowerCase()}");`,
    `    s.setAttribute("data-api-url", "${API_URL}");`,
    "    document.body.appendChild(s);",
    "  }",
    "}",
  ].join("\n");
}

const SNIPPET_BUILDERS: Record<PlatformKey, (bot: AdminBot) => string> = {
  html: scriptSnippet,
  wordpress: scriptSnippet,
  shopify: scriptSnippet,
  react: reactSnippet,
  vue: vueSnippet,
  angular: angularSnippet,
};

const FILE_LABEL: Record<PlatformKey, string> = {
  html: "index.html",
  wordpress: "footer.php",
  shopify: "theme.liquid",
  react: "app/layout.tsx",
  vue: "src/main.js",
  angular: "app.component.ts",
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
      // Clipboard blocked (e.g. insecure context) — select-and-copy still works.
    }
  };

  return (
    <div className="rounded-r2 border border-border bg-surface shadow-panel">
      <div className="border-b border-border px-5 py-4">
        <b className="text-[14px] font-[750]">Install on your website</b>
        <p className="mt-0.5 text-[12.5px] text-muted">
          One snippet, works on every platform. Pick where you&apos;re installing for the exact steps.
        </p>
      </div>

      <div className="p-5">
        {/* Platform selector */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPlatform(p.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px] font-[600] transition-colors",
                platform === p.key
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-panel text-muted hover:text-fg",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <ol className="mb-4 space-y-1.5">
          {WHERE_TO_PASTE[platform].map((step, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] text-muted">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-[700] text-accent">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        {/* Code block */}
        <div className="overflow-hidden rounded-r1 border border-code-border bg-code-bg">
          <div className="flex items-center justify-between border-b border-code-border px-3 py-2">
            <span className="font-mono text-[11px] text-code-sub">
              {FILE_LABEL[platform]}
            </span>
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1.5 rounded-[7px] border border-code-btn-border bg-code-btn px-2.5 py-1 text-[11.5px] font-[600] text-code-btn-fg transition-colors hover:bg-code-btn-hover"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <CopyIcon className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="ae-stream overflow-x-auto px-4 py-3">
            <code className="font-mono text-[12.5px] leading-[1.6] text-code-fg">{snippet}</code>
          </pre>
        </div>

        <p className="mt-3 text-[12px] text-muted">
          Only visitors on domains you allow will get answers — set those under{" "}
          <b className="font-[650] text-fg">Settings → Allowed domains</b>. The snippet is safe to
          commit to your site&apos;s code; it contains no secret keys.
        </p>
      </div>
    </div>
  );
}
