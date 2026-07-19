"use client";

import { cn } from "@/lib/cn";

/** Preset background colors for the open panel. */
const PANEL_BG_SWATCHES = [
  "#ffffff",
  "#fffef8",
  "#eef2ff",
  "#f0fdf4",
  "#0f172a",
  "#111827",
];

interface PanelBgFieldProps {
  value: string; // "" = follow the theme
  onChange: (v: string) => void;
}

export function PanelBgField({ value, onChange }: PanelBgFieldProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Theme default (no custom bg) */}
      <button
        type="button"
        className={cn(
          "h-[26px] rounded-full border px-3 font-ui text-[11px] font-[600]",
          "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          !value
            ? "border-accent text-accent"
            : "border-border bg-panel text-muted hover:text-fg",
        )}
        aria-pressed={!value}
        onClick={() => onChange("")}
      >
        Theme
      </button>

      {PANEL_BG_SWATCHES.map((hex) => (
        <button
          key={hex}
          type="button"
          className={cn(
            "h-[26px] w-[26px] cursor-pointer rounded-full border-2 border-border p-0 transition-transform duration-100",
            "hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            value.toLowerCase() === hex &&
              "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--accent)]",
          )}
          // Swatch is inherently a dynamic color → sanctioned style use.
          style={{ backgroundColor: hex }}
          aria-label={`Panel ${hex}`}
          aria-pressed={value.toLowerCase() === hex}
          onClick={() => onChange(hex)}
        />
      ))}

      {/* Custom color */}
      <label
        className="relative grid h-[26px] w-[26px] cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-border text-faint"
        title="Custom panel color"
      >
        <PlusIcon className="h-[13px] w-[13px]" />
        <input
          type="color"
          className="absolute inset-[-6px] h-[200%] w-[200%] cursor-pointer border-none p-0 opacity-0"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
