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
  // Visual settings from Studio
  if (cfg.logo) rows.push(["logo", cfg.logo]);
  if (cfg.surface !== "auto") rows.push(["surface", cfg.surface]);
  if (cfg.corners !== "soft") rows.push(["corners", cfg.corners]);
  if (cfg.launcher !== "pill") rows.push(["launcher", cfg.launcher]);
  if (!cfg.glass) rows.push(["glass", "off"]);
  if (!cfg.sources) rows.push(["sources", "off"]);
  if (!cfg.brand) rows.push(["whitelabel", "on"]);
  if (cfg.offX !== 24) rows.push(["offset-x", String(cfg.offX)]);
  if (cfg.offY !== 24) rows.push(["offset-y", String(cfg.offY)]);
  // Font settings
  if (cfg.fontSrc === "google" && cfg.gFont) {
    rows.push(["font", "google:" + cfg.gFont]);
  } else if (cfg.fontSrc === "custom" && cfg.cFam && cfg.cUrl) {
    rows.push(["font-family", cfg.cFam]);
    rows.push(["font-url", cfg.cUrl]);
  } else if (cfg.fontSrc === "preset" && cfg.font && cfg.font !== "system") {
    rows.push(["font", cfg.font]);
  }
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
