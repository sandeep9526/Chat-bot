import type { ReactNode } from "react";

/** Section eyebrow with a pulsing live-dot, matching the brand's mono labels. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-[750] uppercase tracking-[.16em] text-accent">
      <span className="eyebrow-dot" />
      {children}
    </span>
  );
}
