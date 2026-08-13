"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

interface RevealProps {
  children?: ReactNode;
  className?: string;
  /** Stagger offset in ms (caller usually passes index * step). */
  delay?: number;
  as?: ElementType;
  variant?: "default" | "zoom" | "line";
  style?: CSSProperties;
  id?: string;
}

/**
 * Fade + rise (+ blur) into view exactly once. The hidden starting state lives
 * in CSS behind `html.reveal-ready` (set pre-paint by MarketingBoot), so if JS
 * fails the element is simply always visible. Under prefers-reduced-motion the
 * CSS forces it visible too — this observer just adds the `.in` class.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as,
  variant = "default",
  style,
  id,
}: RevealProps) {
  const Tag = (as || "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Safety: if the CSS never armed (no boot script), don't hold content hostage.
    if (!document.documentElement.classList.contains("reveal-ready")) {
      el.classList.add("in");
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            io.disconnect();
            // Add `.in` on the next frame so the hidden state is committed to a
            // paint first — makes the enter transition fire deterministically
            // even for zero-delay elements.
            raf = requestAnimationFrame(() => el.classList.add("in"));
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -7% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      id={id}
      data-reveal={variant === "default" ? "" : variant}
      className={className}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
