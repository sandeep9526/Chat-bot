"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// ─── Parallax on scroll ──────────────────────────────────────
export function useParallax<T extends HTMLElement>(speed = 0.15): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        const centerOffset = rect.top + rect.height / 2 - viewH / 2;
        el.style.transform = `translateY(${centerOffset * speed}px)`;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return ref;
}

// ─── 3D tilt on hover ────────────────────────────────────────
export function useTilt<T extends HTMLElement>(
  intensity = 8,
  scale = 1.02
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    el.style.transformStyle = "preserve-3d";
    el.style.transition = "transform 0.15s ease-out";

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(${scale})`;
    };

    const onLeave = () => {
      el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [intensity, scale]);

  return ref;
}

// ─── Magnetic button ─────────────────────────────────────────
export function useMagnetic<T extends HTMLElement>(strength = 0.3): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    el.style.transition = "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)";

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };

    const onLeave = () => {
      el.style.transform = "translate(0px, 0px)";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return ref;
}

// ─── Typewriter effect ───────────────────────────────────────
export function useTypewriter(text: string, active: boolean, speed = 30, startDelay = 0): string {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) { setDisplayed(""); return; }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(text);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let i = 0;
    
    const startTyping = () => {
      const tick = () => {
        if (i < text.length) {
          i++;
          setDisplayed(text.slice(0, i));
          const char = text[i - 1];
          const delay = char === "." || char === "," ? speed * 6 : char === " " ? speed * 0.5 : speed;
          timeout = setTimeout(tick, delay);
        }
      };
      tick();
    };

    timeout = setTimeout(startTyping, startDelay);
    return () => clearTimeout(timeout);
  }, [active, text, speed, startDelay]);

  return displayed;
}

// ─── Scroll Progress ─────────────────────────────────────────
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        el.style.transform = `scaleX(${progress})`;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 h-[3px] w-full origin-left z-[100] pointer-events-none bg-gradient-to-r from-[#F5A900] to-[#E09A00]"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
