import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

interface SectionHeadProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/**
 * The single section header used across the whole page — one eyebrow style, one
 * title scale, one description treatment. Enforcing this everywhere is most of
 * what makes the page read as one consistent system.
 */
export function SectionHead({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeadProps) {
  const center = align === "center";
  return (
    <div
      className={`${center ? "mx-auto max-w-[680px] text-center" : "max-w-[680px]"} ${className}`}
    >
      <Reveal>
        <div className={center ? "flex justify-center" : ""}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      </Reveal>
      <Reveal
        as="h2"
        delay={60}
        className="mt-3 font-display text-[clamp(26px,4vw,40px)] font-[750] leading-[1.12] tracking-[-.02em] text-fg"
      >
        {title}
      </Reveal>
      {description && (
        <Reveal
          as="p"
          delay={120}
          className="mt-4 text-[15.5px] leading-[1.65] text-muted"
        >
          {description}
        </Reveal>
      )}
    </div>
  );
}
