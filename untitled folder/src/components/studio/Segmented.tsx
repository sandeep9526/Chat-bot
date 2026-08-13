"use client";

import { cn } from "@/lib/cn";

interface SegmentedProps<T extends string> {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="flex bg-panel border border-border rounded-[10px] p-[3px] gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            "flex-1 border-none bg-transparent text-muted font-[inherit] text-[12px] font-[600] py-[7px] px-1.5 rounded-[7px] cursor-pointer transition-colors duration-100",
            "focus-visible:outline-2 focus-visible:outline-accent",
            value === opt.value &&
              "bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,.1)]",
          )}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
