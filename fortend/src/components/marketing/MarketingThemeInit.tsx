"use client";

import { useEffect } from "react";

/**
 * Keeps the marketing home dark-first on *client-side* navigations, where the
 * pre-paint boot script in the root layout doesn't re-run. On a hard load this
 * just re-affirms the value the boot script already set (no flash); on a soft
 * nav from another route it applies the visitor's saved choice (default dark).
 */
export function MarketingThemeInit() {
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("zeva-theme");
    } catch {
      /* private mode */
    }
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light"
      );
    }
  }, []);

  return null;
}
