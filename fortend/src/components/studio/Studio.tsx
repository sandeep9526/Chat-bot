"use client";

import { useRef, useState } from "react";
import { ShieldCheck as ShieldCheckIcon, ChevronDown as ChevronDownIcon, Zap, Check } from "lucide-react";
import { useZevaStore } from "@/stores/zevaStore";
import { useZevaChat } from "@/hooks/useZevaChat";
import { Segmented } from "./Segmented";
import { ColorField } from "./ColorField";
import { Switch } from "./Switch";
import { PlacementMap } from "./PlacementMap";
import { FontField } from "./FontField";
import { LogoField } from "./LogoField";
import { PanelBgField } from "./PanelBgField";
import { EmbedCode } from "./EmbedCode";
import { MakeItYoursCard } from "./MakeItYoursCard";
import { DemoSite } from "./DemoSite";
import { StudioBotBanner } from "./StudioBotBanner";
import { ZevaWidget } from "@/components/widget/ZevaWidget";
import { INDUSTRY_TEMPLATES, type IndustryTemplate } from "@/lib/templates";

export function Studio({ botId = "" }: { botId?: string }) {

  const store = useZevaStore();
  const cfg = store.config;
  const chat = useZevaChat();
  const isScanning = store.isQuestionProcessing || chat.isScanning;
  const [ingesting, setIngesting] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [templateStatus, setTemplateStatus] = useState<string | null>(null);
  // Preview stage the widget/font/theme scope to — keeps Surface/corners/font
  // previewing confined to this box instead of reskinning the whole dashboard.
  const stageRef = useRef<HTMLDivElement>(null);

  const isProcessing = isScanning || ingesting || !!applyingTemplate;

  const handleApplyTemplate = async (tmpl: IndustryTemplate) => {
    if (isProcessing) return;

    setApplyingTemplate(tmpl.id);
    setTemplateStatus(null);

    const targetBotId = botId ? botId : `demo-${tmpl.id}`;
    store.setBotId(targetBotId);
    store.setName(tmpl.botName);
    store.setAccent(tmpl.accent);
    store.setWelcome(tmpl.welcome);
    store.setSuggestions(tmpl.suggestions);
    if (tmpl.websiteUrl) store.setWebsiteUrl(tmpl.websiteUrl);
    if (tmpl.logo) store.setLogo(tmpl.logo);

    // Clear previous template questions & chat history
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
        const data = await res.json();
        setTemplateStatus(`${tmpl.name} Template & Knowledge Base Active! (${data.chunks} chunks indexed)`);
        setTimeout(() => setTemplateStatus(null), 4500);
      }
    } catch (err) {
      console.error("Failed to apply template knowledge base:", err);
    } finally {
      setApplyingTemplate(null);
    }
  };


  const handleIngestUrl = async (urlToIngest?: string) => {
    const target = (urlToIngest || store.websiteUrl || "").trim();
    if (!target || isProcessing) return;
    setIngesting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/demo/ingest-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.botId) store.setBotId(data.botId);
        if (data.name) store.setName(data.name);
        if (data.welcome) store.setWelcome(data.welcome);
        if (data.suggestions) store.setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Studio auto-ingest error:", err);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto py-6 px-4 sm:px-6 lg:py-8 lg:px-8 pb-20">
      {botId && <StudioBotBanner botId={botId} />}

      {/* Masthead */}
      <header className="flex items-center gap-[13px] mb-[22px] sm:mb-[26px]">
        <div className="w-[42px] h-[42px] rounded-[13px] grid place-items-center text-white shadow-panel bg-gradient-to-br from-accent to-accent-strong shrink-0">
          <ShieldCheckIcon className="w-[22px] h-[22px]" />
        </div>
        <div>
          <p className="text-[11.5px] tracking-[.16em] uppercase text-muted font-[700] m-0 mb-0.5">
            Zeva Studio
          </p>
          <h1 className="text-[clamp(20px,3vw,28px)] tracking-[-.02em] m-0 font-[750]">
            Make it yours
          </h1>
        </div>
      </header>

      {/* Studio grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] xl:grid-cols-[366px_1fr] gap-6 items-start">
        {/* Controls sidebar */}
        <aside className="w-full bg-surface border border-border rounded-[20px] shadow-panel overflow-hidden lg:sticky lg:top-[74px] lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between py-4 px-[18px] border-b border-border bg-surface">
            <b className="text-sm font-[750]">Customize widget</b>
            <button
              className="border border-border bg-panel text-muted font-ui text-xs font-[600] rounded-[8px] py-[5px] px-2.5 cursor-pointer hover:text-fg transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => {
                if (window.confirm("Reset all customization back to defaults? This can't be undone.")) {
                  store.resetConfig();
                }
              }}
              disabled={isProcessing}
            >
              Reset
            </button>
          </div>

          <div className="py-1 px-[18px] pb-[18px]">
            {/* Industry Templates group */}
            <ControlGroup title="Industry Templates" defaultOpen>
              <div>
                <FieldLabel label="Select Ready Template & Knowledge Base" />

                {/* Dropdown Selector */}
                <div className="mb-2.5">
                  <select
                    value={INDUSTRY_TEMPLATES.find((t) => store.config.name === t.botName)?.id || ""}
                    onChange={(e) => {
                      const tmpl = INDUSTRY_TEMPLATES.find((t) => t.id === e.target.value);
                      if (tmpl) handleApplyTemplate(tmpl);
                    }}
                    disabled={isProcessing}
                    className="w-full border border-border bg-panel text-fg rounded-[9px] py-2 px-3 text-[12.5px] font-[650] outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="" disabled>-- Select Industry Template --</option>
                    {INDUSTRY_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.icon} {tmpl.name} ({tmpl.botName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid of Template Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRY_TEMPLATES.map((tmpl) => {
                    const isSelected = store.config.name === tmpl.botName || store.websiteUrl === tmpl.websiteUrl;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        disabled={isProcessing}
                        title={isProcessing ? "Template selection disabled while question is processing" : tmpl.name}
                        className={`flex flex-col gap-1 p-2.5 border rounded-[10px] text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none group ${
                          isSelected
                            ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent"
                            : "border-border bg-panel hover:bg-surface hover:border-accent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{tmpl.icon}</span>
                          <span className={`text-[12px] font-[750] truncate ${isSelected ? "text-accent" : "text-fg group-hover:text-accent"}`}>
                            {tmpl.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-faint line-clamp-1">
                          {tmpl.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* In-flight question processing alert */}
                {isScanning && (
                  <div className="mt-2.5 rounded-[8px] bg-warn/10 border border-warn/30 px-3 py-2 text-[11.5px] font-[650] text-warn flex items-center gap-2 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-warn animate-pulse shrink-0" />
                    <span>Question is processing... Template selection locked until AI finishes answering.</span>
                  </div>
                )}

                {templateStatus && (
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-[8px] bg-good/10 border border-good/30 px-3 py-2 text-[11.5px] font-[650] text-good animate-fade-in">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    {templateStatus}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-faint leading-relaxed">
                  Selecting a template auto-configures logo, website URL, brand color, greeting, sample questions AND indexes full knowledge base into AI memory!
                </p>
              </div>
            </ControlGroup>


            {/* Website URL group */}
            <ControlGroup title="Your website">
              <div>
                <FieldLabel label="Website URL" />
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                    placeholder="https://example.com"
                    value={store.websiteUrl}
                    onChange={(e) => store.setWebsiteUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleIngestUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleIngestUrl()}
                    disabled={ingesting || !store.websiteUrl.trim()}
                    className="shrink-0 inline-flex items-center gap-1 rounded-[9px] bg-accent px-3 py-[9px] text-[12.5px] font-[650] text-white hover:bg-accent-strong disabled:opacity-50 cursor-pointer"
                  >
                    {ingesting ? "Scraping..." : (<><Zap className="h-3.5 w-3.5" /> Connect</>)}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-faint">Paste your URL and click <b className="inline-flex items-center gap-0.5 align-middle"><Zap className="h-3 w-3" /> Connect</b> to scrape your site &amp; connect your bot knowledge.</p>
              </div>
            </ControlGroup>


            {/* Brand group */}
            <ControlGroup title="Brand">
              <div>
                <FieldLabel
                  label="Accent color"
                  value={cfg.accent.toLowerCase()}
                />
                <ColorField value={cfg.accent} onChange={store.setAccent} />
              </div>
              <div className="mt-4">
                <FieldLabel label="Logo" />
                <LogoField value={cfg.logo} onChange={store.setLogo} />
              </div>
              <div className="mt-4">
                <FieldLabel label="Surface" />
                <Segmented
                  value={cfg.surface}
                  options={[
                    { label: "Auto", value: "auto" },
                    { label: "Light", value: "light" },
                    { label: "Dark", value: "dark" },
                  ]}
                  onChange={store.setSurface}
                />
              </div>
              <div className="mt-4">
                <FieldLabel
                  label="Panel background"
                  value={cfg.panelBg || "theme"}
                />
                <PanelBgField value={cfg.panelBg} onChange={store.setPanelBg} />
              </div>
            </ControlGroup>


            {/* Shape & type group */}
            <ControlGroup title="Shape & type">
              <div>
                <FieldLabel label="Corners" />
                <Segmented
                  value={cfg.corners}
                  options={[
                    { label: "Sharp", value: "sharp" },
                    { label: "Soft", value: "soft" },
                    { label: "Round", value: "round" },
                  ]}
                  onChange={store.setCorners}
                />
              </div>
              <div className="mt-4">
                <FontField
                  fontSrc={cfg.fontSrc}
                  presetFont={cfg.font}
                  gFont={cfg.gFont}
                  cFam={cfg.cFam}
                  cUrl={cfg.cUrl}
                  onFontSrcChange={store.setFontSrc}
                  onPresetFontChange={store.setPresetFont}
                  onGoogleFontChange={store.setGoogleFont}
                  onCustomFontChange={store.setCustomFont}
                />
              </div>
              <div className="mt-4">
                <Switch
                  checked={cfg.glass}
                  onCheckedChange={store.toggleGlass}
                  label="Frosted glass"
                  description="translucent, blurred panel"
                />
              </div>
            </ControlGroup>

            {/* Launcher & position group */}
            <ControlGroup title="Launcher & position">
              <div>
                <FieldLabel label="Launcher style" />
                <Segmented
                  value={cfg.launcher}
                  options={[
                    { label: "Pill", value: "pill" },
                    { label: "Bubble", value: "bubble" },
                    { label: "Bar", value: "bar" },
                  ]}
                  onChange={store.setLauncher}
                />
              </div>
              <div className="mt-4">
                <PlacementMap
                  anchor={cfg.anchor}
                  offX={cfg.offX}
                  offY={cfg.offY}
                  onChange={(anchor) => store.setAnchor(anchor)}
                />
                <p className="mt-2 text-[11.5px] text-faint leading-[1.45]">
                  <b className="text-muted">Or drag it:</b> grab the launcher
                  button in the preview and drop it anywhere {"\u2014"} the position
                  saves into your embed code.
                </p>
              </div>
            </ControlGroup>

            {/* Content group */}
            <ControlGroup title="Content">
              <div>
                <FieldLabel label="Assistant name" />
                <input
                  className="w-full border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                  value={cfg.name}
                  onChange={(e) => store.setName(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <FieldLabel label="Header subtitle" />
                <input
                  className="w-full border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                  value={cfg.subtitle}
                  onChange={(e) => store.setSubtitle(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <FieldLabel label="Launcher label" />
                <input
                  className="w-full border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                  value={cfg.label}
                  onChange={(e) => store.setLabel(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <FieldLabel label="Welcome line" />
                <input
                  className="w-full border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                  value={cfg.welcome}
                  onChange={(e) => store.setWelcome(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <FieldLabel
                  label="Suggested questions"
                  value={`${cfg.suggestions.filter((q) => q.trim()).length} chips`}
                />
                <textarea
                  className="w-full resize-none border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] leading-[1.5] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                  rows={4}
                  value={cfg.suggestions.join("\n")}
                  onChange={(e) => store.setSuggestions(e.target.value.split("\n"))}
                />
                <p className="mt-1.5 text-[11px] text-faint">One question per line.</p>
              </div>
            </ControlGroup>

            {/* Trust & white-label group */}
            <ControlGroup title="Trust & white-label">
              <Switch
                checked={cfg.sources}
                onCheckedChange={store.toggleSources}
                label="Show sources"
                description="the proof card under answers"
              />
              <div className="mt-4">
                <Switch
                  checked={cfg.brand}
                  onCheckedChange={store.toggleBrand}
                  label={"\u201cPowered by Zeva\u201d"}
                  description="turn off to white-label"
                />
              </div>
            </ControlGroup>

          </div>
        </aside>

        {/* Preview column */}
        <div className="w-full min-w-0">
          {/* The stage itself is the widget's positioning context (offsetParent),
              so the panel anchors to the full preview height — like `.ae` being a
              direct child of `.stage` in the prototype. */}
          <div
            ref={stageRef}
            className="relative rounded-[22px] overflow-hidden border border-border bg-surface shadow-panel min-h-[480px] sm:min-h-[580px] lg:min-h-[620px]"
          >
            {/* Browser bar */}
            <div className="flex items-center gap-2 py-3 px-4 border-b border-border bg-panel">
              <span className="w-[11px] h-[11px] rounded-full bg-red-400" />
              <span className="w-[11px] h-[11px] rounded-full bg-amber-400" />
              <span className="w-[11px] h-[11px] rounded-full bg-emerald-400" />
              <span className="ml-2.5 text-xs text-faint bg-surface border border-border rounded-[8px] py-1 px-3 font-mono truncate max-w-[300px]">
                {store.websiteUrl ? (() => { try { return new URL(store.websiteUrl).hostname } catch { return store.websiteUrl } })() : "zeva.ai"}
              </span>
            </div>

            <DemoSite websiteUrl={store.websiteUrl} />
            <ZevaWidget positionMode="absolute" themeScopeRef={stageRef} />

          </div>

          {/* Signed-in editing a real bot → show the embed snippet. Public
              visitor → the "Make it yours" funnel instead (an embed snippet is
              useless with no account/bot yet). */}
          {botId ? <EmbedCode config={cfg} /> : <MakeItYoursCard />}
        </div>
      </div>
    </div>
  );
}

/* ---- Small helper components ---- */

function ControlGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-2 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="text-[10.5px] tracking-[.13em] uppercase text-faint font-[700]">
          {title}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-faint transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2.5 mb-2">
      <span className="text-[12.5px] font-[650] text-fg">{label}</span>
      {value && (
        <span className="font-mono text-[11px] text-faint font-[600]">
          {value}
        </span>
      )}
    </div>
  );
}
