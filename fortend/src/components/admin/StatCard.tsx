import React from "react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  trend?: { value: string; isPositive: boolean };
  subtext?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  subtext,
  badge,
  icon,
}: StatCardProps) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-accent/40 hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted">{icon}</span>}
            <span className="text-[12.5px] font-[650] text-muted truncate">
              {label}
            </span>
          </div>
          {badge}
        </div>
        <div className="mt-2 text-[28px] sm:text-[30px] font-[800] leading-none tracking-tight text-fg">
          {value}
        </div>
        {hint && (
          <p className="mt-1 text-[11.5px] text-muted truncate">{hint}</p>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-border/50 text-[11.5px]">
          {trend ? (
            <span
              className={cn(
                "font-[700]",
                trend.isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-500"
              )}
            >
              {trend.isPositive ? "↗" : "↘"} {trend.value}
            </span>
          ) : (
            <span />
          )}
          {subtext && (
            <span className="text-muted font-[550] text-[11px]">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
