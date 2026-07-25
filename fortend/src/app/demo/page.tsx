"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useZevaStore } from "@/stores/zevaStore";
import { useZevaChat } from "@/hooks/useZevaChat";
import { DemoSite } from "@/components/studio/DemoSite";
import { ZevaWidget } from "@/components/widget/ZevaWidget";
import { INDUSTRY_TEMPLATES, type IndustryTemplate } from "@/lib/templates";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { Footer } from "@/components/marketing/Footer";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { ArrowRightIcon, CheckIcon } from "@/components/marketing/icons";
import { Lock, Loader2 } from "lucide-react";

/**
 * Public "watch it work" demo page.
 * Users can switch between industry presets to see how Zeva adapts its
 * brand logo, website background, sample questions, and RAG AI knowledge base.
 */
export default function DemoPage() {
  const store = useZevaStore();
  const setOpen = store.setOpen;
  const chat = useZevaChat();
  const isScanning = store.isQuestionProcessing || chat.isScanning;
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isProcessing = isScanning || !!applyingTemplate;

  // Open widget immediately on page load
  useEffect(() => {
    setOpen(true);
  }, [setOpen]);

  // Apply a template preset
  const handleSelectPreset = async (tmpl: IndustryTemplate) => {
    if (isProcessing) return;

    setApplyingTemplate(tmpl.id);
    setStatusMsg(null);

    const targetBotId = `demo-${tmpl.id}`;
    store.setBotId(targetBotId);
    store.setName(tmpl.botName);
    store.setAccent(tmpl.accent);
    store.setWelcome(tmpl.welcome);
    store.setSuggestions(tmpl.suggestions);
    if (tmpl.websiteUrl) store.setWebsiteUrl(tmpl.websiteUrl);
    if (tmpl.logo) store.setLogo(tmpl.logo);

    // Clear previous chat messages & questions
    store.resetSession();

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/demo/apply-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: targetBotId,
          templateId: tmpl.id,
          knowledgeText: tmpl.knowledgeText,
          name: tmpl.botName,
          accent: tmpl.accent,
          welcome: tmpl.welcome,
          suggestions: tmpl.suggestions,
        }),
      });
      if (res.ok) {
        setStatusMsg(`${tmpl.name} Preset Active!`);
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } catch (err) {
      console.error("Failed to apply preset:", err);
    } finally {
      setApplyingTemplate(null);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-6 py-12 sm:px-9 sm:py-16">
        <div className="max-w-[640px]">
          <Eyebrow>Live demo</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(28px,4.4vw,42px)] font-[800] leading-[1.08] tracking-[-.03em] text-fg">
            A real bot, answering from real documents.
          </h1>
          <p className="mt-4 text-[16px] leading-[1.6] text-muted">
            This is Zeva AI&apos;s actual assistant, backed by the real Zeva RAG
            API — not a script. Switch industry presets below to test how the brand, website, sample questions, and AI knowledge adapt live.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            {["Real retrieval, real sources", "No script, no canned answers", "Answers from your own docs"].map(
              (r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-2 text-[13.5px] font-[600] text-muted"
                >
                  <CheckIcon className="h-4 w-4 text-good" />
                  {r}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Industry Presets Bar */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-[700] uppercase tracking-wider text-muted mr-2">Try Preset:</span>
            {INDUSTRY_TEMPLATES.map((tmpl) => {
              const isSelected = store.config.name === tmpl.botName || store.websiteUrl === tmpl.websiteUrl;
              const isBusy = applyingTemplate === tmpl.id;

              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectPreset(tmpl)}
                  disabled={isProcessing}
                  title={isProcessing ? "Preset locked while question is processing" : tmpl.name}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[12.5px] font-[650] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
                    isSelected
                      ? "border-accent bg-accent/10 text-accent ring-1 ring-accent shadow-sm"
                      : "border-border bg-surface hover:border-accent text-fg"
                  }`}
                >
                  <span className="text-sm">{tmpl.icon}</span>
                  <span>{tmpl.name}</span>
                  {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                </button>
              );
            })}
          </div>

          {isScanning && (
            <div className="mt-2.5 rounded-[8px] bg-warn/10 border border-warn/30 px-3 py-1.5 text-[11.5px] font-[650] text-warn flex items-center gap-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-warn animate-pulse shrink-0" />
              <span>Question is processing... Preset selection locked until response completes.</span>
            </div>
          )}

          {statusMsg && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-[8px] bg-good/10 border border-good/30 px-3 py-1.5 text-[11.5px] font-[650] text-good animate-fade-in">
              <CheckIcon className="h-3.5 w-3.5 shrink-0" />
              {statusMsg}
            </div>
          )}
        </div>

        {/* Browser frame holding the real DemoSite + working widget */}
        <div className="relative mt-8 min-h-[620px] overflow-hidden rounded-r3 border border-border bg-surface shadow-panel">
          <div className="flex items-center gap-2 border-b border-border bg-panel px-4 py-3">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
            <span className="ml-2.5 flex items-center gap-1.5 truncate rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-faint">
              <Lock className="h-3 w-3" />
              {store.websiteUrl ? (() => { try { return new URL(store.websiteUrl).hostname } catch { return store.websiteUrl } })() : "zeva.ai/demo"}
            </span>
          </div>

          <DemoSite websiteUrl={store.websiteUrl} />
          <ZevaWidget positionMode="absolute" />
        </div>

        {/* Closing CTA */}
        <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 border-accent-ring p-7">
          <p className="m-0 max-w-[52ch] text-[15px] text-muted">
            Like what you see? Customize your brand color, welcome greeting & logo in Studio, then get your 1-line embed script.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard#appearance"
              className="inline-flex items-center gap-2 rounded-r1 border border-border bg-surface px-5 py-2.5 text-[14px] font-[650] text-fg hover:border-accent"
            >
              Customize in Studio
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex shrink-0 items-center gap-2 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-2.5 text-[14px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
            >
              Get started free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
