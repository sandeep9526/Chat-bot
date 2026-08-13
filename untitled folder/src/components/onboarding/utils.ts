/** Shared helpers for the onboarding wizard. */

/** Only lowercase letters, digits, and single hyphens (no leading/trailing/doubled hyphens). */
export const BOT_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Turn a business name into a URL-safe bot id suggestion. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isValidBotId(botId: string): boolean {
  return BOT_ID_PATTERN.test(botId);
}
