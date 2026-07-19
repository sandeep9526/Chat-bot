"use client";

import { cn } from "@/lib/cn";
import { Segmented } from "./Segmented";
import { GOOGLE_FONT_SUGGESTIONS } from "@/lib/defaults";
import type { FontSrc, PresetFont } from "@/lib/types";

const TEXT_INPUT =
  "w-full rounded-[9px] border border-border bg-surface px-[11px] py-[9px] font-ui text-[13px] text-fg outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring";

interface FontFieldProps {
  fontSrc: FontSrc;
  presetFont: PresetFont;
  gFont: string;
  cFam: string;
  cUrl: string;
  onFontSrcChange: (v: FontSrc) => void;
  onPresetFontChange: (v: PresetFont) => void;
  onGoogleFontChange: (name: string) => void;
  onCustomFontChange: (fam: string, url: string) => void;
}

export function FontField({
  fontSrc,
  presetFont,
  gFont,
  cFam,
  cUrl,
  onFontSrcChange,
  onPresetFontChange,
  onGoogleFontChange,
  onCustomFontChange,
}: FontFieldProps) {
  const fontSrcOptions: { label: string; value: FontSrc }[] = [
    { label: "Preset", value: "preset" },
    { label: "Google", value: "google" },
    { label: "Custom", value: "custom" },
    { label: "My site", value: "inherit" },
  ];

  const presetOptions: { label: string; value: PresetFont }[] = [
    { label: "System", value: "system" },
    { label: "Rounded", value: "rounded" },
    { label: "Serif", value: "serif" },
    { label: "Mono", value: "mono" },
  ];

  const fontLabel =
    fontSrc === "google"
      ? "google:" + gFont
      : fontSrc === "custom"
        ? cFam || "custom…"
        : fontSrc === "inherit"
          ? "inherit"
          : presetFont;

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12.5px] font-[650] text-fg">Font</span>
          <span className="font-mono text-[11px] font-[600] text-faint">
            {fontLabel}
          </span>
        </div>
        <Segmented
          value={fontSrc}
          options={fontSrcOptions}
          onChange={onFontSrcChange}
        />
      </div>

      {/* Preset pane */}
      {fontSrc === "preset" && (
        <div className="mt-2.5">
          <Segmented
            value={presetFont}
            options={presetOptions}
            onChange={onPresetFontChange}
          />
        </div>
      )}

      {/* Google pane — loaded live at runtime by useZevaTheme. */}
      {fontSrc === "google" && (
        <div className="mt-2.5">
          <input
            className={TEXT_INPUT}
            placeholder="Google font name — e.g. Poppins"
            value={gFont}
            onChange={(e) => onGoogleFontChange(e.target.value.trim() || "Poppins")}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GOOGLE_FONT_SUGGESTIONS.map((f) => (
              <button
                key={f}
                type="button"
                className={cn(
                  "cursor-pointer rounded-full border border-border bg-surface px-[11px] py-[5px] font-ui text-[12px] font-[600] text-muted",
                  "transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent",
                )}
                onClick={() => onGoogleFontChange(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] leading-[1.45] text-faint">
            Loads live from Google Fonts into the widget — covers most fonts real
            websites use.
          </p>
        </div>
      )}

      {/* Custom pane — an @font-face is injected from the URL. */}
      {fontSrc === "custom" && (
        <div className="mt-2.5 space-y-2">
          <input
            className={TEXT_INPUT}
            placeholder="Font family name — e.g. Brand Sans"
            value={cFam}
            onChange={(e) => onCustomFontChange(e.target.value.trim(), cUrl)}
          />
          <input
            className={TEXT_INPUT}
            placeholder="Font file URL — https://…/brand.woff2"
            value={cUrl}
            onChange={(e) => onCustomFontChange(cFam, e.target.value.trim())}
          />
          <p className="text-[11.5px] leading-[1.45] text-faint">
            Self-host <b className="text-muted">your own or a licensed font</b>{" "}
            via{" "}
            <code className="rounded-[5px] border border-border bg-panel px-1 font-mono text-[.92em]">
              @font-face
            </code>
            . Needs a .woff2/.woff URL you&apos;re allowed to serve.
          </p>
        </div>
      )}

      {/* Inherit pane — the widget adopts the host page's font (inline embed). */}
      {fontSrc === "inherit" && (
        <div className="mt-2.5">
          <p className="text-[11.5px] leading-[1.45] text-faint">
            Uses your website&apos;s{" "}
            <b className="text-muted">exact font — even paid ones</b> — by
            inheriting whatever your page already loaded. Requires{" "}
            <b className="text-muted">inline embed (Shadow&nbsp;DOM)</b>, not the
            iframe. Preview shows the fallback UI font.
          </p>
        </div>
      )}
    </div>
  );
}
