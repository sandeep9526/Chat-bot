"use client";

import { useState } from "react";
import { useCreateBot } from "@/hooks/useAdmin";
import { AdminApiError } from "@/lib/adminApi";
import { DEFAULTS } from "@/lib/defaults";
import { isValidBotId, slugify } from "./utils";
import type { WizardData } from "./types";

const INPUT =
  "w-full rounded-[9px] border border-border bg-surface px-[13px] py-2.5 font-ui text-[14px] text-fg outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring";

interface StepNameBotProps {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
}

/** Live-sanitize keystrokes (lowercase, spaces → hyphens); full slugify happens on blur. */
function sanitizeLive(v: string): string {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function StepNameBot({ data, onNext }: StepNameBotProps) {
  const [businessName, setBusinessName] = useState(data.businessName);
  const [botId, setBotId] = useState(data.botId);
  const [botIdTouched, setBotIdTouched] = useState(Boolean(data.botId));
  const [errorMsg, setErrorMsg] = useState("");
  const createBot = useCreateBot();

  const trimmedName = businessName.trim();
  const botIdValid = botId.length > 0 && isValidBotId(botId);
  const canContinue = trimmedName.length > 0 && botIdValid;

  const handleNameChange = (value: string) => {
    setBusinessName(value);
    if (!botIdTouched) setBotId(slugify(value));
  };

  const handleBotIdChange = (value: string) => {
    setBotId(sanitizeLive(value));
    setBotIdTouched(true);
  };

  const handleBotIdBlur = () => {
    setBotId((v) => slugify(v));
  };

  const handleContinue = async () => {
    setErrorMsg("");
    if (!canContinue) return;
    const welcome =
      data.welcome ||
      `Ask in your own words — every answer comes from ${trimmedName}'s own documents.`;
    try {
      await createBot.mutateAsync({
        botId,
        name: trimmedName,
        accent: data.accent || DEFAULTS.accent,
        welcome,
        suggestions: [],
        allowedDomains: ["*"],
      });
      onNext({ businessName: trimmedName, botId, welcome });
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 403) {
        setErrorMsg(
          `"${botId}" is already taken by another account — please pick a different bot ID.`,
        );
      } else {
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
        );
      }
    }
  };

  return (
    <div className="rounded-r2 border border-border bg-surface p-6 shadow-panel">
      <b className="text-base font-[750] text-fg">Name your bot</b>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        This is your business name and a unique ID your widget will use.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-[650] text-fg">
            Business name
          </label>
          <input
            autoFocus
            className={INPUT}
            placeholder="Acme Salon"
            value={businessName}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12.5px] font-[650] text-fg">
            Bot ID
          </label>
          <input
            className={INPUT}
            placeholder="acme-salon"
            value={botId}
            onChange={(e) => handleBotIdChange(e.target.value)}
            onBlur={handleBotIdBlur}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
          <p className="mt-1.5 text-[11px] text-faint">
            Lowercase letters, numbers, and hyphens only — this becomes part of
            your embed code.
          </p>
          {botId.length > 0 && !botIdValid && (
            <p className="mt-1.5 text-[11.5px] text-red-500">
              Only lowercase letters, numbers, and single hyphens (no spaces).
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-[13px] text-red-500">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          className="w-full cursor-pointer rounded-lg bg-accent py-2.5 font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleContinue}
          disabled={!canContinue || createBot.isPending}
        >
          {createBot.isPending ? "Reserving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
