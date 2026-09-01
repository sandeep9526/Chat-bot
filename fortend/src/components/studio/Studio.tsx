"use client";

import { useRef, useState } from "react";
import { ShieldCheck as ShieldCheckIcon, ChevronDown as ChevronDownIcon, Zap, Check, Paintbrush, Sparkles, RotateCcw, Globe, Palette, Type, MousePointerClick, MessageSquare, Lock, Contact } from "lucide-react";
import { cn } from "@/lib/cn";
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
import { LeadFormBuilder } from "@/components/admin/LeadFormBuilder";
import { INDUSTRY_TEMPLATES, type IndustryTemplate } from "@/lib/templates";

function StudioControlsContent({ store, cfg, botId, hideBanner, ingesting, handleIngestUrl, reopenTimerRef }: any) {
  return (
    <>
      {/* Website URL group */}
      {!hideBanner && (
        <ControlGroup title="Your website" icon={<Globe className="h-[13px] w-[13px]" />}>
          <div>
            <FieldLabel label="Website URL" />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                  <input
                    className="w-full border border-border bg-panel text-fg rounded-xl py-2.5 pl-9 pr-3 font-mono text-[13px] outline-none transition-all focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10 placeholder:text-muted"
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
                </div>
                <button
                  type="button"
                  onClick={() => handleIngestUrl()}
                  disabled={ingesting || !store.websiteUrl.trim()}
                  className="group relative shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-[700] text-white hover:bg-accent-strong transition-all disabled:opacity-50 overflow-hidden shadow-sm"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                  {ingesting ? "Scraping..." : (<><Sparkles className="h-4 w-4" /> Connect</>)}
                </button>
              </div>
              <p className="ml-1 text-[11.5px] text-muted">Paste your URL to automatically teach the AI about your business.</p>
            </div>
          </div>
        </ControlGroup>
      )}

      {/* Brand group */}
      <ControlGroup title="Brand" icon={<Palette className="h-[13px] w-[13px]" />} defaultOpen={hideBanner}>
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
      <ControlGroup title="Shape & type" icon={<Type className="h-[13px] w-[13px]" />}>
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
      <ControlGroup title="Launcher & position" icon={<MousePointerClick className="h-[13px] w-[13px]" />}>
        <div>
          <FieldLabel label="Launcher style" />
          <Segmented
            value={cfg.launcher}
            options={[
              { label: "Pill", value: "pill" },
              { label: "Bubble", value: "bubble" },
              { label: "Bar", value: "bar" },
            ]}
            onChange={(v) => {
              store.setLauncher(v as any);
              store.setOpen(false);
              if (reopenTimerRef.current) clearTimeout(reopenTimerRef.current);
              reopenTimerRef.current = setTimeout(() => store.setOpen(true), 2000);
            }}
          />
        </div>
        <div className="mt-4">
          <PlacementMap
            anchor={cfg.anchor}
            offX={cfg.offX}
            offY={cfg.offY}
            onChange={(anchor) => {
              store.setAnchor(anchor);
              store.setOpen(false);
              if (reopenTimerRef.current) clearTimeout(reopenTimerRef.current);
              reopenTimerRef.current = setTimeout(() => store.setOpen(true), 2000);
            }}
          />
          <p className="mt-2 text-[11.5px] text-faint leading-[1.45]">
            <b className="text-muted">Or drag it:</b> grab the launcher
            button in the preview and drop it anywhere {"\u2014"} the position
            saves into your embed code.
          </p>
        </div>
      </ControlGroup>

      {/* Content group */}
      <ControlGroup title="Content" icon={<MessageSquare className="h-[13px] w-[13px]" />}>
        <div>
          <FieldLabel label="Assistant name" />
          <input
            className="w-full border border-border bg-panel text-fg rounded-xl py-2.5 px-3 font-[inherit] text-[13px] outline-none transition-all focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10 placeholder:text-muted"
            value={cfg.name}
            onChange={(e) => store.setName(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <FieldLabel label="Header subtitle" />
          <input
            className="w-full border border-border bg-panel text-fg rounded-xl py-2.5 px-3 font-[inherit] text-[13px] outline-none transition-all focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10 placeholder:text-muted"
            value={cfg.subtitle}
            onChange={(e) => store.setSubtitle(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <FieldLabel label="Launcher label" />
          <input
            className="w-full border border-border bg-panel text-fg rounded-xl py-2.5 px-3 font-[inherit] text-[13px] outline-none transition-all focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10 placeholder:text-muted"
            value={cfg.label}
            onChange={(e) => store.setLabel(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <FieldLabel label="Welcome line" />
          <input
            className="w-full border border-border bg-panel text-fg rounded-xl py-2.5 px-3 font-[inherit] text-[13px] outline-none transition-all focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10 placeholder:text-muted"
            value={cfg.welcome}
            onChange={(e) => store.setWelcome(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <FieldLabel
            label="Suggested questions"
            value={`${cfg.suggestions.filter((q: string) => q.trim()).length} chips`}
          />
          <textarea
            className="w-full resize-y border border-border bg-panel text-fg rounded-xl py-2.5 px-3 font-[inherit] text-[13px] leading-[1.6] outline-none transition-all focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10 placeholder:text-muted min-h-[100px]"
            rows={4}
            value={cfg.suggestions.join("\n")}
            onChange={(e) => store.setSuggestions(e.target.value.split("\n"))}
          />
          <p className="mt-1.5 text-[11.5px] text-muted">One question per line.</p>
        </div>
      </ControlGroup>

      {/* Trust & white-label group */}
      <ControlGroup title="Trust & white-label" icon={<ShieldCheckIcon className="h-[13px] w-[13px]" />}>
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
            label={"\u201cPowered by ochreshift\u201d"}
            description="turn off to white-label"
          />
        </div>
      </ControlGroup>

      {/* Lead capture group */}
      <ControlGroup title="Lead capture form" icon={<Contact className="h-[13px] w-[13px]" />}>
        <LeadFormBuilder botId={botId} />
      </ControlGroup>
    </>
  );
}

export function Studio({ botId = "", hideBanner = false, controlsOnly = false }: { botId?: string, hideBanner?: boolean, controlsOnly?: boolean }) {

  const store = useZevaStore();
  const cfg = store.config;
  const reopenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chat = useZevaChat();
  const isScanning = store.isQuestionProcessing || chat.isScanning;
  const [ingesting, setIngesting] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
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

  // In controlsOnly mode, render just the raw controls — no wrapper, grid, or preview.
  // The parent (OnboardingWizard) provides its own card/scrollable container.
  if (controlsOnly) {
    return (
      <div className="flex flex-col gap-0">
        <div className="flex items-center justify-between py-3 px-1 mb-2">
          <b className="text-[14px] font-[750] tracking-tight text-fg">Customize widget</b>
          <button
            title="Reset all settings"
            className="group flex h-7 w-7 items-center justify-center rounded-full border border-border bg-panel text-muted transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
            onClick={() => {
              if (window.confirm("Reset all customization back to defaults?")) {
                store.resetConfig();
              }
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-90" />
          </button>
        </div>
        <div className="py-0">
          <StudioControlsContent
            store={store}
            cfg={cfg}
            botId={botId}
            hideBanner={true} // In controlsOnly, we don't need the website URL ingest banner
            ingesting={ingesting}
            handleIngestUrl={handleIngestUrl}
            reopenTimerRef={reopenTimerRef}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 ${hideBanner ? "pt-2 pb-10 lg:pt-4" : "py-6 lg:py-8 pb-20"}`}>
      {!hideBanner && botId && <StudioBotBanner botId={botId} />}

      {/* Masthead */}
      {!hideBanner && (
        <header className="flex items-center gap-[15px] mb-[26px]">
          <div className="relative w-[44px] h-[44px] rounded-[14px] grid place-items-center text-white shadow-[0_4px_20px_-2px_rgba(var(--color-accent),0.4)] bg-gradient-to-br from-accent to-accent-strong shrink-0">
            <div className="absolute inset-0 bg-white/20 rounded-[14px] animate-pulse pointer-events-none" style={{ animationDuration: '3s' }} />
            <Paintbrush className="w-[22px] h-[22px] relative z-10 drop-shadow-md" />
          </div>
          <div>
            <p className="text-[11.5px] tracking-[.18em] uppercase text-accent font-[750] m-0 mb-0.5">
              ochreshift Studio
            </p>
            <h1 className="text-[clamp(20px,3vw,26px)] tracking-tight m-0 font-[800] text-fg">
              Make it yours
            </h1>
          </div>
        </header>
      )}

      {/* Studio grid */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-[340px_1fr] xl:grid-cols-[366px_1fr] gap-6", hideBanner ? "items-stretch" : "items-start")}>
        {/* Controls sidebar */}
        <aside className={cn(
          "w-full bg-surface border border-border rounded-[20px] shadow-panel overflow-hidden overflow-y-auto",
          hideBanner ? "h-[480px] sm:h-[580px] lg:h-[620px] flex flex-col" : "lg:sticky lg:top-[74px] lg:max-h-[calc(100vh-96px)]"
        )}>
          <div className="sticky top-0 z-10 flex items-center justify-between py-4 px-5 border-b border-border bg-surface/95 backdrop-blur-sm">
            <b className="text-[14.5px] font-[750] tracking-tight">Customize widget</b>
            <button
              title="Reset all settings"
              className="group flex h-8 w-8 items-center justify-center rounded-full border border-border bg-panel text-muted transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => {
                if (window.confirm("Reset all customization back to defaults? This can't be undone.")) {
                  store.resetConfig();
                }
              }}
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-90" />
            </button>
          </div>


          <div className="py-1 px-[18px] pb-[18px]">
            <StudioControlsContent
              store={store}
              cfg={cfg}
              botId={botId}
              hideBanner={hideBanner}
              ingesting={ingesting}
              handleIngestUrl={handleIngestUrl}
              reopenTimerRef={reopenTimerRef}
            />
          </div>
        </aside>

        {/* Preview column */}
        <div className="w-full min-w-0">
          {/* The stage itself is the widget's positioning context (offsetParent),
              so the panel anchors to the full preview height — like `.ae` being a
              direct child of `.stage` in the prototype. */}
          <div
            ref={stageRef}
            className={cn(
              "relative rounded-[22px] overflow-hidden border border-border bg-surface shadow-panel",
              hideBanner ? "h-[480px] sm:h-[580px] lg:h-[620px]" : "min-h-[480px] sm:min-h-[580px] lg:min-h-[620px]"
            )}
          >
            {/* Browser bar */}
            <div className="flex items-center justify-between py-3 px-4 border-b border-border bg-panel">
              <div className="flex items-center gap-2">
                <span className="w-[11px] h-[11px] rounded-full bg-[#FF5F56]" />
                <span className="w-[11px] h-[11px] rounded-full bg-[#FFBD2E]" />
                <span className="w-[11px] h-[11px] rounded-full bg-[#27C93F]" />
              </div>
              <div className="flex items-center justify-center absolute left-1/2 -translate-x-1/2 w-[240px] max-w-[50%]">
                <div className="flex w-full items-center justify-center gap-1.5 bg-surface/80 border border-border/80 shadow-sm rounded-md py-1 px-3">
                  <Lock className="h-3 w-3 text-muted shrink-0" />
                  <span className="text-[11px] font-medium text-fg truncate">
                    {isFallback 
                      ? "ochreshift.in" 
                      : (store.websiteUrl ? (() => { try { return new URL(store.websiteUrl).hostname } catch { return store.websiteUrl } })() : "ochreshift.ai")}
                  </span>
                </div>
              </div>
              <div className="w-[45px]" /> {/* Spacer for flex balance */}
            </div>

            <DemoSite websiteUrl={store.websiteUrl} onFallbackStatusChange={setIsFallback} />
            <ZevaWidget positionMode="absolute" themeScopeRef={stageRef} />

          </div>

          {/* Signed-in editing a real bot → show the embed snippet. Public
              visitor → the "Make it yours" funnel instead (an embed snippet is
              useless with no account/bot yet). */}
          {!hideBanner && (botId ? <EmbedCode config={cfg} /> : <MakeItYoursCard />)}
        </div>
      </div>
    </div>
  );
}

/* ---- Small helper components ---- */

function ControlGroup({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
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
        className="group flex w-full cursor-pointer items-center justify-between gap-2 py-4 text-left focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className={`grid h-[26px] w-[26px] place-items-center rounded-md border transition-colors ${open ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-panel border-border text-muted group-hover:text-fg group-hover:bg-surface group-hover:border-border/80'}`}>
              {icon}
            </div>
          )}
          <span className={`text-[11px] tracking-[.15em] uppercase font-[750] transition-colors ${open ? 'text-fg' : 'text-muted group-hover:text-fg'}`}>
            {title}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-faint transition-transform duration-300 ${open ? "rotate-180" : ""
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
