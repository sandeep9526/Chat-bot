"use client";

import { useEffect, useRef, useState } from "react";
import { useZevaStore } from "@/stores/zevaStore";
import { useBots, useCreateBot } from "@/hooks/useAdmin";
import { AdminApiError } from "@/lib/adminApi";
import { markSetupDone } from "@/lib/setupProgress";
import { getBotDesign, stashBotDesign, type BotDesign } from "@/lib/pendingDesign";

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * When Studio is opened for a specific bot (`/studio?bot=<id>`), this loads that
 * bot's saved brand (name / accent / welcome / suggestions) into the Studio
 * store and lets the owner save edits back via the create-bot upsert. Rich
 * config (corners/launcher/font) still lives only in the embed snippet — the
 * banner is explicit that only the persisted fields are saved.
 */
export function StudioBotBanner({ botId }: { botId: string }) {
  const { data: bots } = useBots();
  const bot = (bots ?? []).find((b) => b.bot_id === botId);
  const createBot = useCreateBot();

  const cfg = useZevaStore((s) => s.config);
  const websiteUrl = useZevaStore((s) => s.websiteUrl);
  const setName = useZevaStore((s) => s.setName);
  const setAccent = useZevaStore((s) => s.setAccent);
  const setWelcome = useZevaStore((s) => s.setWelcome);
  const setSuggestions = useZevaStore((s) => s.setSuggestions);
  const applyConfig = useZevaStore((s) => s.applyConfig);

  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const loadedFor = useRef("");

  // Load the bot's saved brand once (owner list first, else the public /config
  // so the preview still brands even when signed out). Store setters aren't
  // React state, so this isn't a setState-in-effect.
  useEffect(() => {
    if (!botId || loadedFor.current === botId) return;
    const apply = (d: {
      name?: string;
      accent?: string;
      welcome?: string;
      suggestions?: string[];
      design?: BotDesign | Record<string, never>;
    }) => {
      loadedFor.current = botId;
      // Restore the full "Make it yours" look (corners/font/launcher/… and the
      // preview website URL). PREFER the server-saved design — for a signed-in
      // owner it lives in the DB (survives across browsers/devices); fall back
      // to the localStorage stash for the anonymous funnel or bots saved before
      // backend persistence. Then let the canonical brand columns below win.
      const server =
        d.design && "config" in d.design ? (d.design as BotDesign) : null;
      const design = server ?? getBotDesign(botId);
      if (design) applyConfig(design.config, design.websiteUrl);
      if (d.name) setName(d.name);
      if (d.accent) setAccent(d.accent);
      if (d.welcome) setWelcome(d.welcome);
      if (d.suggestions && d.suggestions.length) setSuggestions(d.suggestions);
    };
    if (bot) {
      apply({
        name: bot.name,
        accent: bot.accent,
        welcome: bot.welcome,
        suggestions: bot.suggestions,
        design: bot.design,
      });
      return;
    }
    if (API) {
      fetch(`${API}/config?botId=${encodeURIComponent(botId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && apply(d))
        .catch(() => {});
    }
  }, [botId, bot, setName, setAccent, setWelcome, setSuggestions, applyConfig]);

  if (!botId) return null;

  const canSave = Boolean(bot);
  const save = async () => {
    setErr("");
    setSaved(false);
    try {
      // Persist the FULL look server-side (design column) so a signed-in owner's
      // logo / panel bg / corners / font / launcher / subtitle / position and the
      // preview website URL survive across browsers and devices — not just this
      // one localStorage. The brand columns (name/accent/welcome/suggestions)
      // stay first-class so the widget/backend read them directly.
      await createBot.mutateAsync({
        botId,
        name: cfg.name,
        accent: cfg.accent,
        welcome: cfg.welcome,
        suggestions: cfg.suggestions.filter((s) => s.trim()),
        allowedDomains: bot?.allowed_domains ?? ["*"],
        design: { config: cfg, websiteUrl },
      });
      // Also keep a local stash — a fast, offline-friendly cache and the fallback
      // for anonymous edits. On load the server design wins over this.
      stashBotDesign(botId, cfg, websiteUrl);
      markSetupDone(botId, "customize");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e instanceof AdminApiError ? e.message : "Save failed.");
    }
  };

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-r2 border border-accent-ring bg-accent-soft px-4 py-3">
      <div className="min-w-0 text-[13px] leading-snug">
        <span className="font-[700] text-accent">Editing a live bot</span>
        <span className="text-muted">
          {" "}
          — all your widget changes save to{" "}
        </span>
        <span className="font-mono font-[650] text-fg">{botId}</span>
        <span className="text-muted">.</span>
      </div>
      <div className="flex items-center gap-2.5">
        {err && <span className="text-[12px] text-red-500">{err}</span>}
        {saved && <span className="text-[12px] font-[700] text-good">✓ Saved</span>}
        <a
          href="/dashboard#bots"
          className="rounded-r1 border border-border bg-surface px-3 py-1.5 text-[12.5px] font-[650] text-fg hover:border-accent"
        >
          Back to bots
        </a>
        <button
          type="button"
          onClick={save}
          disabled={!canSave || createBot.isPending}
          title={canSave ? undefined : "Open this bot from your dashboard to save changes."}
          className="rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-4 py-1.5 text-[12.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createBot.isPending ? "Saving…" : canSave ? "Save changes" : "Sign in to save"}
        </button>
      </div>
    </div>
  );
}
