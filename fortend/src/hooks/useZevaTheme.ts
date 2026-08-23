"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import type { ZevaConfig } from "@/lib/types";
import { effectiveTheme } from "@/lib/color";

const GF_LINK_ID = "zeva-google-font";
const CF_STYLE_ID = "zeva-custom-font";

/** Guess the @font-face format keyword from a font URL. */
function fontFormat(url: string): string {
  if (/\.woff2(\?|$)/i.test(url)) return "woff2";
  if (/\.woff(\?|$)/i.test(url)) return "woff";
  if (/\.otf(\?|$)/i.test(url)) return "opentype";
  if (/\.ttf(\?|$)/i.test(url)) return "truetype";
  return "woff2";
}

/** Load (or update) a Google font at runtime via a <link> in <head>. */
function loadGoogleFont(name: string): void {
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    name,
  ).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;
  let link = document.getElementById(GF_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = GF_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

/** Inject (or update) an @font-face for a user-supplied font file. */
function loadCustomFont(family: string, url: string): void {
  let style = document.getElementById(CF_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = CF_STYLE_ID;
    document.head.appendChild(style);
  }
  const fam = family.replace(/"/g, "");
  const src = url.replace(/"/g, "");
  style.textContent = `@font-face{font-family:"${fam}";src:url("${src}") format("${fontFormat(
    src,
  )}");font-weight:100 900;font-display:swap;}`;
}

function removeById(id: string): void {
  document.getElementById(id)?.remove();
}

/**
 * Applies the live config to a theme root so the widget themes itself on
 * whatever page it's mounted (studio preview or /demo).
 *
 * By default the theme root is `<html>`, for the widget's normal case of being
 * the only themed thing on the page (marketing home, /demo). Pass `scopeRef`
 * to theme a specific element instead (its subtree, via the `[data-theme]`
 * attribute selectors in globals.css which aren't `:root`-anchored) — this is
 * required wherever the widget/preview is embedded inside a page that has its
 * own independent chrome, e.g. the Studio tab inside the operator dashboard,
 * so picking a Surface/corners/font here never reskins the surrounding app.
 * Scoped mode also skips adopting the page-wide `zeva-theme` localStorage
 * preference, since that's the *host chrome's* choice, not this bot's config.
 *
 * NOTE: the accent (`--accent`/`--accent-strong`) is deliberately NOT written
 * here — it lives only on the widget's own root (see ZevaWidget's inline
 * style), so picking a brand colour recolours the *widget*, never the host
 * page/chrome.
 */
export function useZevaTheme(
  config: ZevaConfig,
  scopeRef?: RefObject<HTMLElement | null>,
): void {
  const { surface, corners, fontSrc, font, gFont, cFam, cUrl } = config;
  const scoped = !!scopeRef;

  // Surface → data-theme. Unscoped: respects saved zeva-theme first, then
  // follows surface/OS. Scoped: always reflects `surface` directly.
  useEffect(() => {
    const root = scoped ? scopeRef.current : document.documentElement;
    if (!root) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      let themeToApply: "light" | "dark";
      try {
        const saved = scoped ? null : localStorage.getItem("zeva-theme");
        if (saved === "dark" || saved === "light") {
          themeToApply = saved;
        } else {
          themeToApply = effectiveTheme(surface, mq.matches);
        }
      } catch {
        themeToApply = effectiveTheme(surface, mq.matches);
      }
      root.setAttribute("data-theme", themeToApply);
    };
    apply();
    if (surface === "auto") mq.addEventListener("change", apply);
    return () => {
      if (surface === "auto") mq.removeEventListener("change", apply);
      if (scoped) root.removeAttribute("data-theme");
    };
  }, [surface, scoped, scopeRef]);

  // Corners radius scale. Scoped mode resets on unmount so switching away from
  // the preview (e.g. a dashboard tab change) can't leave the host stuck.
  useEffect(() => {
    const root = scoped ? scopeRef.current : document.documentElement;
    if (!root) return;
    root.setAttribute("data-corners", corners);
    if (!scoped) return;
    return () => root.removeAttribute("data-corners");
  }, [corners, scoped, scopeRef]);

  // Fonts: preset (CSS-driven) / google / custom @font-face / inherit.
  useEffect(() => {
    const root = scoped ? scopeRef.current : document.documentElement;
    if (!root) return;

    if (fontSrc === "preset") {
      // Let :root[data-font="…"] drive --font-family from globals.css.
      root.style.removeProperty("--font-family");
      root.setAttribute("data-font", font);
      removeById(GF_LINK_ID);
      removeById(CF_STYLE_ID);
      return;
    }

    // Non-preset modes: neutralise the preset CSS hook and set the family here.
    root.setAttribute("data-font", "custom");

    if (fontSrc === "google") {
      if (gFont.trim()) {
        loadGoogleFont(gFont);
        root.style.setProperty("--font-family", `"${gFont}", var(--ui-stack)`);
      } else {
        // Field cleared mid-edit — hold the UI stack rather than requesting a
        // Google Fonts URL with an empty family name.
        root.style.setProperty("--font-family", "var(--ui-stack)");
      }
      removeById(CF_STYLE_ID);
    } else if (fontSrc === "custom") {
      if (cFam && cUrl) {
        loadCustomFont(cFam, cUrl);
        root.style.setProperty("--font-family", `"${cFam}", var(--ui-stack)`);
      } else {
        root.style.setProperty("--font-family", "var(--ui-stack)");
      }
      removeById(GF_LINK_ID);
    } else {
      // "inherit" — the widget adopts the host page's font. NOTE: this only
      // *truly* inherits the customer's site font in the inline / Shadow-DOM
      // embed; the iframe embed has no page to inherit, so it falls back to the
      // UI stack (which is what the studio/demo preview shows).
      root.style.setProperty("--font-family", "inherit");
      removeById(GF_LINK_ID);
      removeById(CF_STYLE_ID);
    }

    if (!scoped) return;
    return () => {
      root.removeAttribute("data-font");
      root.style.removeProperty("--font-family");
    };
  }, [fontSrc, font, gFont, cFam, cUrl, scoped, scopeRef]);
}
