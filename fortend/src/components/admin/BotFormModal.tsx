"use client";

import { useEffect, useState } from "react";
import { useCreateBot } from "@/hooks/useAdmin";
import { AdminApiError, type AdminBot } from "@/lib/adminApi";
import { DEFAULTS } from "@/lib/defaults";
import { isValidBotId, slugify } from "@/components/onboarding/utils";

const SWATCHES = ["#4f46e5", "#0ea5e9", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6"];

/** Pre-fill for a brand-new bot — e.g. a design carried over from the public
 *  Studio's "Make it yours" flow. */
export interface BotInitial {
  name?: string;
  accent?: string;
  welcome?: string;
  suggestions?: string[];
}

const INPUT =
  "w-full rounded-r1 border border-border bg-surface px-3.5 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-ring";
const LABEL = "mb-1.5 block text-[12.5px] font-[650] text-fg";

function sanitizeLive(v: string): string {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

interface BotFormModalProps {
  mode: "create" | "edit";
  bot?: AdminBot;
  /** Create-mode pre-fill (from the "Make it yours" funnel). Ignored on edit. */
  initial?: BotInitial;
  onClose: () => void;
  onSaved: (botId: string) => void;
}

export function BotFormModal({ mode, bot, initial, onClose, onSaved }: BotFormModalProps) {
  const isEdit = mode === "edit";
  const seed = isEdit ? undefined : initial;
  const [name, setName] = useState(bot?.name ?? seed?.name ?? "");
  const [botId, setBotId] = useState(
    bot?.bot_id ?? (seed?.name ? slugify(seed.name) : ""),
  );
  const [botIdTouched, setBotIdTouched] = useState(isEdit);
  const [accent, setAccent] = useState(bot?.accent ?? seed?.accent ?? DEFAULTS.accent);
  const [welcome, setWelcome] = useState(bot?.welcome ?? seed?.welcome ?? "");
  const [suggestions, setSuggestions] = useState(
    (bot?.suggestions ?? seed?.suggestions ?? []).join("\n"),
  );
  const [error, setError] = useState("");

  const createBot = useCreateBot();

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trimmedName = name.trim();
  const botIdValid = botId.length > 0 && isValidBotId(botId);
  const canSave = trimmedName.length > 0 && botIdValid && !createBot.isPending;

  const onNameChange = (v: string) => {
    setName(v);
    if (!isEdit && !botIdTouched) setBotId(slugify(v));
  };

  const save = async () => {
    setError("");
    if (!canSave) return;
    try {
      await createBot.mutateAsync({
        botId,
        name: trimmedName,
        accent,
        welcome:
          welcome.trim() ||
          `Ask in your own words — every answer comes from ${trimmedName}'s own documents.`,
        suggestions: suggestions.split("\n").map((s) => s.trim()).filter(Boolean),
        allowedDomains: bot?.allowed_domains ?? ["*"],
      });
      onSaved(botId);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 403) {
        setError(`"${botId}" is already taken — pick a different bot ID.`);
      } else if (err instanceof AdminApiError && err.status === 402) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-r3 border border-border bg-surface p-6 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-[750] tracking-[-.01em] text-fg">
            {isEdit ? "Edit bot" : "Create a bot"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap grid h-8 w-8 place-items-center rounded-r1 text-faint hover:bg-panel hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={LABEL}>Business name</label>
            <input
              autoFocus
              className={INPUT}
              placeholder="Acme Salon"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div>
            <label className={LABEL}>Bot ID</label>
            <input
              className={`${INPUT} font-mono ${isEdit ? "cursor-not-allowed opacity-60" : ""}`}
              placeholder="acme-salon"
              value={botId}
              disabled={isEdit}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(e) => {
                setBotId(sanitizeLive(e.target.value));
                setBotIdTouched(true);
              }}
              onBlur={() => setBotId((v) => slugify(v))}
            />
            <p className="mt-1.5 text-[11px] text-faint">
              {isEdit
                ? "The bot ID is baked into your embed code and can't change."
                : "Lowercase letters, numbers, hyphens — becomes part of your embed code."}
            </p>
            {botId.length > 0 && !botIdValid && !isEdit && (
              <p className="mt-1 text-[11.5px] text-red-500">
                Only lowercase letters, numbers, and single hyphens.
              </p>
            )}
          </div>

          <div>
            <label className={LABEL}>Accent colour</label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-9 w-10 shrink-0 cursor-pointer rounded-r1 border border-border bg-surface p-0.5"
                aria-label="Accent colour"
              />
              <div className="flex flex-wrap gap-1.5">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccent(c)}
                    aria-label={`Use ${c}`}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      accent.toLowerCase() === c ? "border-fg" : "border-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={LABEL}>Welcome line <span className="font-normal text-faint">(optional)</span></label>
            <input
              className={INPUT}
              placeholder="Ask us anything about our services…"
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
            />
          </div>

          <div>
            <label className={LABEL}>Suggested questions <span className="font-normal text-faint">(one per line)</span></label>
            <textarea
              rows={3}
              className={`${INPUT} resize-none leading-[1.5]`}
              placeholder={"What are your hours?\nHow much is a haircut?"}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-r1 bg-red-500/10 px-4 py-3 text-[13px] text-red-500">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-r1 border border-border bg-surface px-4 py-2.5 text-[13.5px] font-[650] text-fg hover:bg-panel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-5 py-2.5 text-[13.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createBot.isPending ? "Saving…" : isEdit ? "Save changes" : "Create bot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
