"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { LauncherStyle } from "@/lib/types";

const launcher = cva(
  "flex items-center gap-2.5 cursor-grab touch-none border border-border text-fg font-ui text-[14px] font-[650] shadow-panel transition-transform duration-100 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        pill: "rounded-full py-[11px] pl-3 pr-4",
        bubble: "w-[58px] h-[58px] p-0 justify-center rounded-full",
        bar: "w-full justify-start rounded-r2 py-[11px] pl-3 pr-4",
      },
    },
    defaultVariants: { variant: "pill" },
  },
);

interface LauncherProps {
  label: string;
  variant: LauncherStyle;
  glass: boolean;
  logo: string;
  isDragging: boolean;
  onClick: () => void;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}

export function Launcher({
  label,
  variant,
  glass,
  logo,
  isDragging,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: LauncherProps) {
  const isBubble = variant === "bubble";

  return (
    <button
      type="button"
      className={cn(
        launcher({ variant }),
        // Bubble is always the gradient chip; pill/bar follow the glass toggle.
        isBubble
          ? "bg-gradient-to-br from-accent to-accent-strong text-white"
          : glass
            ? "bg-glass backdrop-blur-xl"
            : "bg-surface",
        isDragging ? "cursor-grabbing" : "motion-safe:animate-breathe",
      )}
      aria-label={label}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-full",
          isBubble
            ? "w-[30px] h-[30px]"
            : "w-[25px] h-[25px]",
          !logo &&
            !isBubble &&
            "bg-gradient-to-br from-accent to-accent-strong text-white",
        )}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime data URL / arbitrary logo
          <img src={logo} alt="" className="h-full w-full object-cover" />
        ) : (
          <SparkIcon
            className={cn(isBubble ? "w-[26px] h-[26px] text-white" : "w-3.5 h-3.5")}
          />
        )}
      </span>
      {!isBubble && (
        <>
          <span className="leading-tight">{label}</span>
          <span className="rounded-[6px] border border-border px-1.5 py-px font-mono text-[11px] text-faint">
            /
          </span>
        </>
      )}
    </button>
  );
}

function SparkIcon({ className }: { className?: string }) {
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
      <path d="M12 3v3M12 18v3M5 12H2M22 12h-3" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  );
}
