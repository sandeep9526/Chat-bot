"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./panelIcons";

/**
 * Light/dark toggle for the panel chrome. globals.css keys its dark tokens off
 * `data-theme="dark"` on <html>; the layout boot script sets it pre-paint from
 * the SAME `zeva-theme` key this writes, so the choice persists consistently
 * across the whole site (marketing, studio, dashboard). When unset, follows OS.
 */
const KEY = "zeva-theme";
type Mode = "light" | "dark";

function resolveInitial(): Mode {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  // Lazy initializer reads localStorage/OS at first render. Safe because these
  // panels are dynamic(ssr:false) — there's no server HTML to hydrate against,
  // so no mismatch and no need to setState from an effect.
  const [mode, setMode] = useState<Mode>(resolveInitial);

  // Keep <html data-theme> in sync with the chosen mode (globals.css keys its
  // dark tokens off it). This is the effect's only job — a DOM side effect.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const toggle = () => {
    const next: Mode = mode === "dark" ? "light" : "dark";
    window.localStorage.setItem(KEY, next);
    setMode(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mode === "dark" ? "Light mode" : "Dark mode"}
      className="tap grid h-9 w-9 place-items-center rounded-r1 border border-border bg-surface text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
    >
      {mode === "dark" ? (
        <SunIcon className="h-[18px] w-[18px]" />
      ) : (
        <MoonIcon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
