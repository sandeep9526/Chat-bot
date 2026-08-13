/**
 * First-run setup progress for the dashboard checklist.
 *
 * The three per-bot steps (knowledge / customize / install) are inherently
 * client-side actions the backend can't observe cleanly (a doc ingest, a Studio
 * save, copying the embed snippet), so we record each one *when it actually
 * happens* in localStorage — never inferred, never faked. The "create a bot"
 * step isn't tracked here at all; it's derived live from the real bots list.
 *
 * Progress is keyed per bot so each bot has its own journey, and a custom event
 * lets the checklist update the moment a step is completed anywhere in the app.
 */
export type SetupStep = "knowledge" | "customize" | "install";

export const SETUP_EVENT = "zeva:setup-changed";

const flagsKey = (botId: string) => `zeva-setup:${botId || "new"}`;
const dismissKey = (botId: string) => `zeva-setup-dismissed:${botId || "new"}`;

export type SetupFlags = Partial<Record<SetupStep, boolean>>;

export function getSetupFlags(botId: string): SetupFlags {
  try {
    const raw = localStorage.getItem(flagsKey(botId));
    return raw ? (JSON.parse(raw) as SetupFlags) : {};
  } catch {
    return {};
  }
}

/** Record a real, just-completed setup action. No-op if already recorded. */
export function markSetupDone(botId: string, step: SetupStep): void {
  try {
    const flags = getSetupFlags(botId);
    if (flags[step]) return; // already done — don't spam the update event
    flags[step] = true;
    localStorage.setItem(flagsKey(botId), JSON.stringify(flags));
    window.dispatchEvent(new CustomEvent(SETUP_EVENT, { detail: { botId } }));
  } catch {
    /* private mode — progress just won't persist, non-fatal */
  }
}

export function isSetupDismissed(botId: string): boolean {
  try {
    return localStorage.getItem(dismissKey(botId)) === "1";
  } catch {
    return false;
  }
}

export function dismissSetup(botId: string): void {
  try {
    localStorage.setItem(dismissKey(botId), "1");
    window.dispatchEvent(new CustomEvent(SETUP_EVENT, { detail: { botId } }));
  } catch {
    /* ignore */
  }
}
