"use client";

import { useEffect } from "react";
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
 * Applies the live config to the document root so the widget themes itself on
 * whatever page it's mounted (studio preview or /demo).
 *
 * NOTE: the accent (`--accent`/`--accent-strong`) is deliberately NOT written to
 * <html> here — it lives only on the widget's own root (see ZevaWidget's inline
 * style), so picking a brand colour recolours the *widget*, never the host page
 * (the studio chrome / mock preview site keep Zeva's own brand). `data-theme`,
 * `data-corners`, `data-font` and the runtime font loading still apply page-wide
 * so the Surface / corners / font controls double as the page theme.
 */
export function useZevaTheme(config: ZevaConfig): void {
  const { surface, corners, fontSrc, font, gFont, cFam, cUrl } = config;

  // Surface → data-theme. "auto" follows prefers-color-scheme (with a listener).
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      root.setAttribute("data-theme", effectiveTheme(surface, mq.matches));
    apply();
    if (surface !== "auto") return;
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [surface]);

  // Corners radius scale.
  useEffect(() => {
    document.documentElement.setAttribute("data-corners", corners);
  }, [corners]);

  // Fonts: preset (CSS-driven) / google / custom @font-face / inherit.
  useEffect(() => {
    const root = document.documentElement;

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
      loadGoogleFont(gFont);
      root.style.setProperty("--font-family", `"${gFont}", var(--ui-stack)`);
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
  }, [fontSrc, font, gFont, cFam, cUrl]);
}
