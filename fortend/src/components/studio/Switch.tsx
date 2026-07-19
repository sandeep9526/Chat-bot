"use client";

import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  description?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
}: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12.5px] font-[650] text-fg">
        {label}
        {description && (
          <small className="block font-[500] text-faint text-[11px] mt-0.5">
            {description}
          </small>
        )}
      </span>
      <button
        type="button"
        className={cn(
          "w-10 h-[23px] rounded-full border-none cursor-pointer relative shrink-0 transition-colors duration-[180ms]",
          "after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-[17px] after:h-[17px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,.3)] after:transition-transform after:duration-[180ms]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          checked
            ? "bg-accent after:translate-x-[17px]"
            : "bg-border after:translate-x-0",
        )}
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
      />
    </div>
  );
}
