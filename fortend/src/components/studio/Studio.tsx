"use client";

import { useState } from "react";
import { useZevaStore } from "@/stores/zevaStore";
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

export function Studio({ botId = "" }: { botId?: string }) {
  const store = useZevaStore();
  const cfg = store.config;
  // Theme + font application lives in the widget (useZevaTheme), so the studio
  // preview and /demo stay in sync from the single store config.

  return (
    <div className="max-w-[1240px] mx-auto py-11 px-9 pb-20 max-md:py-[22px] max-md:px-4">
      {botId && <StudioBotBanner botId={botId} />}

      {/* Masthead */}
      <header className="flex items-center gap-[13px] mb-[26px]">
        <div className="w-[42px] h-[42px] rounded-[13px] grid place-items-center text-white shadow-panel bg-gradient-to-br from-accent to-accent-strong">
          <ShieldCheckIcon className="w-[22px] h-[22px]" />
        </div>
        <div>
          <p className="text-[11.5px] tracking-[.16em] uppercase text-muted font-[700] m-0 mb-1">
            Zeva Studio
          </p>
          <h1 className="text-[clamp(22px,3vw,30px)] tracking-[-.02em] m-0 font-[750]">
            Make it yours
          </h1>
        </div>
      </header>

      {/* Studio grid */}
      <div className="grid grid-cols-[366px_1fr] gap-6 items-start max-[940px]:grid-cols-1">
        {/* Controls sidebar — sticky + self-scrolling so it never runs past
            the preview; groups collapse so only what you're editing is open. */}
        <aside className="bg-surface border border-border rounded-[20px] shadow-panel overflow-hidden min-[940px]:sticky min-[940px]:top-[74px] min-[940px]:max-h-[calc(100vh-96px)] min-[940px]:overflow-y-auto min-[940px]:overflow-x-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between py-4 px-[18px] border-b border-border bg-surface">
            <b className="text-sm font-[750]">Customize widget</b>
            <button
              className="border border-border bg-panel text-muted font-ui text-xs font-[600] rounded-[8px] py-[5px] px-2.5 cursor-pointer hover:text-fg transition-colors focus-visible:outline-2 focus-visible:outline-accent"
              onClick={store.resetConfig}
            >
              Reset
            </button>
          </div>

          <div className="py-1 px-[18px] pb-[18px]">
            {/* Website URL group */}
            <ControlGroup title="Your website">
              <div>
                <FieldLabel label="Website URL" />
                <input
                  className="w-full border border-border bg-surface text-fg rounded-[9px] py-[9px] px-[11px] font-[inherit] text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent-ring"
                  placeholder="https://example.com"
                  value={store.websiteUrl}
                  onChange={(e) => store.setWebsiteUrl(e.target.value)}
                />
                <p className="mt-1.5 text-[11px] text-faint">Preview your site here with the widget on top. Some sites block being shown in a frame (that&apos;s a security setting on their end) — it doesn&apos;t affect your live widget.</p>
              </div>
            </ControlGroup>

            {/* Brand group */}
            <ControlGroup title="Brand" defaultOpen>
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
                  onChange={(e) => store.setName(e.target.value || "Your business")}
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
                  onChange={(e) => store.setLabel(e.target.value || "Ask")}
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
        <div>
          {/* The stage itself is the widget's positioning context (offsetParent),
              so the panel anchors to the full preview height — like `.ae` being a
              direct child of `.stage` in the prototype. */}
          <div className="relative rounded-[22px] overflow-hidden border border-border bg-surface shadow-panel min-h-[620px]">
            {/* Browser bar */}
            <div className="flex items-center gap-2 py-3 px-4 border-b border-border bg-panel">
              <span className="w-[11px] h-[11px] rounded-full bg-red-400" />
              <span className="w-[11px] h-[11px] rounded-full bg-amber-400" />
              <span className="w-[11px] h-[11px] rounded-full bg-emerald-400" />
              <span className="ml-2.5 text-xs text-faint bg-surface border border-border rounded-[8px] py-1 px-3 font-mono truncate max-w-[300px]">
                {store.websiteUrl ? (() => { try { return new URL(store.websiteUrl).hostname } catch { return store.websiteUrl } })() : "acmesalon.com"}
              </span>
            </div>

            <DemoSite websiteUrl={store.websiteUrl} />
            <ZevaWidget />
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
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

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3 4 7v6c0 4 3.5 7 8 8 4.5-1 8-4 8-8V7l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
