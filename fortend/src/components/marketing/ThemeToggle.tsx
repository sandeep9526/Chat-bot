"use client";

import { useEffect, useState } from "react";

/**
 * Marketing theme toggle. The initial `data-theme` is set pre-paint by
 * MarketingBoot, so here we only mirror + flip it, persisting the choice to
 * localStorage. Starts unmounted-safe (defaults to dark) and syncs to the real
 * DOM value on mount to avoid a hydration mismatch.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  // Mirror the live <html data-theme> — via a MutationObserver so every toggle
  // instance (nav + footer) stays in sync when any of them flips it. The
  // initial read is deferred a frame so it isn't a synchronous effect setState.
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.getAttribute("data-theme") !== "light");
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    const raf = requestAnimationFrame(sync);
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("zeva-theme", next);
    } catch {
      /* private mode — non-fatal */
    }
    setDark(!dark);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`tap group relative grid h-9 w-9 place-items-center overflow-hidden rounded-r1 border border-border bg-surface/60 text-fg transition-colors hover:border-accent-ring hover:text-accent ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px] transition-transform duration-500"
        style={{ transform: dark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)" }}
      >
        {/* moon */}
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute h-[18px] w-[18px] transition-transform duration-500"
        style={{ transform: dark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)" }}
      >
        {/* sun */}
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
