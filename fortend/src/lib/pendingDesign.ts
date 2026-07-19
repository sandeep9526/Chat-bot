/**
 * "Make it yours" funnel storage.
 *
 * A visitor can design their whole chatbot on the public /studio without an
 * account. When they hit "Make it yours" we stash that full design in
 * localStorage and send them to sign up — so after they have an account the
 * create-bot form is pre-filled and nothing has to be re-entered.
 *
 * The backend only persists name/accent/welcome/suggestions, so we ALSO keep
 * the full look (corners/font/launcher/…) under the created bot's id, letting
 * Studio restore the complete design the first time it's opened for that bot.
 */
import type { ZevaConfig } from "./types";

const PENDING_KEY = "zeva-pending-design";
const designKey = (botId: string) => `zeva-design:${botId}`;

export interface PendingDesign {
  config: ZevaConfig;
  websiteUrl: string;
}

export function savePendingDesign(config: ZevaConfig, websiteUrl: string): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ config, websiteUrl }));
  } catch {
    /* private mode — the funnel just falls back to a blank create form */
  }
}

export function getPendingDesign(): PendingDesign | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingDesign;
    return parsed?.config ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingDesign(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** A bot's saved Studio look — config plus the preview website URL. */
export interface BotDesign {
  config: ZevaConfig;
  websiteUrl: string;
}

/**
 * Persist a bot's full look so Studio can restore corners/font/launcher AND the
 * "Your website" preview URL. Stored as { config, websiteUrl }; older stashes
 * held a bare ZevaConfig, which getBotDesign still reads (see below).
 */
export function stashBotDesign(
  botId: string,
  config: ZevaConfig,
  websiteUrl = "",
): void {
  try {
    localStorage.setItem(designKey(botId), JSON.stringify({ config, websiteUrl }));
  } catch {
    /* ignore */
  }
}

export function getBotDesign(botId: string): BotDesign | null {
  try {
    const raw = localStorage.getItem(designKey(botId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BotDesign | ZevaConfig;
    // New shape: { config, websiteUrl }. Legacy shape: a bare ZevaConfig.
    if (parsed && "config" in parsed && parsed.config) {
      return { config: parsed.config, websiteUrl: parsed.websiteUrl ?? "" };
    }
    return { config: parsed as ZevaConfig, websiteUrl: "" };
  } catch {
    return null;
  }
}
