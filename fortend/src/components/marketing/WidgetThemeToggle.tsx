"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useZevaStore } from "@/stores/zevaStore";

/** Site-wide persisted theme, shared with the marketing ThemeToggle so a choice
 *  made on any page carries across the whole site (main ↔ demo ↔ studio). */
const THEME_KEY = "zeva-theme";

/**
 * Dark/light toggle for the Studio + Demo pages. On those pages the page theme
 * is driven by the widget's `surface` config (useZevaTheme sets <html>
 * data-theme from it), so a plain data-theme toggle would get overwritten. This
 * flips `surface` instead — keeping the page chrome, the widget preview and the
 * Studio "Surface" control all in sync from the single store value.
 *
 * It also bridges the two theme systems: on mount it adopts the site-wide saved
 * theme (`zeva-theme`, the same key the marketing toggle writes) so dark chosen
 * on the main page carries into demo/studio, and it writes that key back on
 * every toggle so the choice persists everywhere.
 */
export function WidgetThemeToggle({ className = "" }: { className?: string }) {
  const setSurface = useZevaStore((s) => s.setSurface);
  const [dark, setDark] = useState(false);

  // Mirror the live effective theme (data-theme reflects surface incl. "auto").
  useEffect(() => {
    const el = document.documentElement;
    // Adopt the site-wide saved theme first, so a dark choice made on the main
    // page shows through here (the pre-paint boot already set data-theme; this
    // aligns the widget's surface so useZevaTheme keeps it instead of reverting
    // to the OS default).
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") setSurface(saved);
    } catch {
      /* private mode — fall back to surface default */
    }
    const sync = () => setDark(el.getAttribute("data-theme") === "dark");
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    const raf = requestAnimationFrame(sync);
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [setSurface]);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    setSurface(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — choice just won't persist */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`tap group relative grid h-9 w-9 place-items-center overflow-hidden rounded-r1 border border-border bg-surface/60 text-fg transition-colors hover:border-accent-ring hover:text-accent ${className}`}
    >
      <Moon
        className="h-[18px] w-[18px] transition-transform duration-500"
        style={{ transform: dark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)" }}
      />
      <Sun
        className="absolute h-[18px] w-[18px] transition-transform duration-500"
        style={{ transform: dark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)" }}
      />
    </button>
  );
}
