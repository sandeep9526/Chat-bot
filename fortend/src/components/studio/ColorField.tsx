"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { ACCENT_SWATCHES } from "@/lib/defaults";

interface ColorFieldProps {
  value: string;
  /** `strong` carries the swatch's hand-tuned dark shade; the picker omits it
      so the store derives one via shade(). */
  onChange: (hex: string, strong?: string) => void;
}

export function ColorField({ value, onChange }: ColorFieldProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  // A saved brand colour is often NOT one of the presets (e.g. a bot loaded from
  // the backend with accent #811831). When that's the case, the "+" custom
  // swatch renders FILLED with the current colour + a selected ring, so the
  // sidebar visibly reflects the active accent instead of looking empty.
  const isCustom =
    Boolean(value) &&
    !ACCENT_SWATCHES.some((sw) => sw.hex.toLowerCase() === value.toLowerCase());

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {ACCENT_SWATCHES.map((sw) => (
          <button
            key={sw.hex}
            type="button"
            className={cn(
              "w-[26px] h-[26px] rounded-full cursor-pointer p-0 transition-transform duration-100",
              "hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              // Selected: a clean surface-gap + swatch-colour ring. Unselected: a
              // hairline so any accent (incl. dark/near-black, or light) stays
              // visible against the panel.
              value.toLowerCase() === sw.hex.toLowerCase()
                ? "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_currentColor]"
                : "shadow-[0_0_0_1px_var(--swatch-ring)]",
            )}
            // Swatch palette colors are inherently dynamic data → the one
            // sanctioned style use for rendering an arbitrary color.
            style={{ backgroundColor: sw.hex, color: sw.hex }}
            aria-label={`Accent ${sw.hex}`}
            aria-pressed={value.toLowerCase() === sw.hex.toLowerCase()}
            onClick={() => onChange(sw.hex, sw.strong)}
          />
        ))}
        <label
          className={cn(
            "relative w-[26px] h-[26px] rounded-full overflow-hidden cursor-pointer grid place-items-center transition-transform duration-100 hover:scale-110",
            isCustom
              ? // Filled with the live custom colour + selected ring (currentColor).
                "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_currentColor] text-white"
              : "border-2 border-dashed border-border text-faint",
          )}
          // When custom, paint the swatch AND set currentColor for the ring.
          style={isCustom ? { backgroundColor: value, color: value } : undefined}
          title={isCustom ? `Custom color ${value.toLowerCase()}` : "Custom color"}
          aria-pressed={isCustom}
        >
          {/* Keep the + only when empty; a filled custom swatch shows the colour. */}
          {!isCustom && <PlusIcon className="w-[13px] h-[13px]" />}
          <input
            ref={pickerRef}
            type="color"
            className="absolute inset-[-6px] w-[200%] h-[200%] cursor-pointer border-none p-0 opacity-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
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
