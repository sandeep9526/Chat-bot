"use client";

import { cn } from "@/lib/cn";
import type { Anchor } from "@/lib/types";

interface PlacementMapProps {
  anchor: Anchor;
  offX: number;
  offY: number;
  onChange: (anchor: Anchor) => void;
}

const CORNERS: Anchor[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

function getDotPosition(anchor: Anchor) {
  switch (anchor) {
    case "top-left":
      return "top-[6px] left-[6px]";
    case "top-right":
      return "top-[6px] right-[6px]";
    case "bottom-left":
      return "bottom-[6px] left-[6px]";
    case "bottom-right":
      return "bottom-[6px] right-[6px]";
  }
}

export function PlacementMap({
  anchor,
  offX,
  offY,
  onChange,
}: PlacementMapProps) {
  const isDefault = offX === 24 && offY === 24;
  // After a drag (custom offset) no corner is "active" \u2014 matching the prototype.
  const display = isDefault ? anchor : `${anchor} \u00b7 ${offX}\u00d7${offY}px`;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12.5px] font-[650] text-fg">Placement</span>
        <span className="font-mono text-[11px] text-faint font-[600]">
          {display}
        </span>
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full aspect-video bg-panel border border-border rounded-[10px] p-2">
        {CORNERS.map((c) => {
          const active = isDefault && anchor === c;
          return (
          <button
            key={c}
            type="button"
            className={cn(
              "border border-dashed border-border bg-transparent rounded-[7px] cursor-pointer relative",
              "hover:border-accent",
              "focus-visible:outline-2 focus-visible:outline-accent",
              active && "border-solid border-accent",
            )}
            aria-pressed={active}
            title={c.replace("-", " ")}
            onClick={() => onChange(c)}
          >
            <span
              className={cn(
                "absolute w-3 h-3 rounded-full transition-[background,opacity] duration-100",
                active ? "bg-accent opacity-100" : "bg-faint opacity-45",
                getDotPosition(c),
              )}
            />
          </button>
          );
        })}
      </div>
    </div>
  );
}
