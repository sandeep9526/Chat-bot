"use client";

import { cn } from "@/lib/cn";

interface StepIndicatorProps {
  step: number;
  total: number;
  titles: string[];
  /** Highest step the user has successfully reached — earlier steps are clickable. */
  furthestStep: number;
  onJump: (step: number) => void;
}

export function StepIndicator({
  step,
  total,
  titles,
  furthestStep,
  onJump,
}: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const reachable = n <= furthestStep;
          const active = n === step;
          const done = n < step;
          return (
            <button
              key={n}
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(n)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-150",
                reachable ? "cursor-pointer" : "cursor-not-allowed",
                active || done ? "bg-accent" : "bg-border",
              )}
              title={titles[n - 1]}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-[700] uppercase tracking-[.16em] text-muted">
          Step {step} of {total}
        </p>
        <p className="text-[13px] font-[650] text-fg">{titles[step - 1]}</p>
      </div>
    </div>
  );
}
