import type { ZevaConfig } from "./types";
import { BOT_ID } from "./defaults";

/** Backend API URL for the widget */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Build the data-* rows for the embed snippet.
 * `botId` defaults to the demo tenant (BOT_ID) so existing callers — the
 * Studio page, which always previews the single demo bot — keep working
 * unchanged. The onboarding wizard passes the client's real botId.
 */
export function buildEmbedRows(cfg: ZevaConfig, botId: string = BOT_ID): [string, string][] {
  const rows: [string, string][] = [
    ["bot-id", botId],
    ["name", cfg.name],
    ["accent", cfg.accent.toLowerCase()],
    ["position", cfg.anchor],
    ["api-url", API_URL],
  ];
  if (!cfg.brand) rows.push(["whitelabel", "on"]);
  return rows;
}

/** Build the plain-text embed snippet. */
export function buildEmbedText(cfg: ZevaConfig, botId: string = BOT_ID): string {
  const rows = buildEmbedRows(cfg, botId);
  return (
    '<script\n  src="https://cdn.zeva.app/widget.js"\n  ' +
    rows.map(([k, v]) => `data-${k}="${v}"`).join("\n  ") +
    "\n  async><\/script>"
  );
}

/** Build syntax-highlighted embed HTML for display. */
export function buildEmbedHtml(cfg: ZevaConfig, botId: string = BOT_ID): string {
  const rows = buildEmbedRows(cfg, botId);
  let html =
    '<span class="text-sky-300">&lt;script</span>\n' +
    '  <span class="text-indigo-300">src</span>=<span class="text-green-300">"https://cdn.zeva.app/widget.js"</span>';
  rows.forEach(([k, v]) => {
    html +=
      '\n  <span class="text-indigo-300">data-' +
      k +
      '</span>=<span class="text-green-300">"' +
      escapeHtml(v) +
      '"</span>';
  });
  html += '\n  <span class="text-indigo-300">async</span><span class="text-sky-300">&gt;&lt;/script&gt;</span>';
  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
