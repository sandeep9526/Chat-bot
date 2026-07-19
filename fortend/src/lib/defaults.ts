import type { ZevaConfig } from "./types";

/** Demo tenant id sent with every /chat and /lead call. */
export const BOT_ID = "acme-salon";

export const DEFAULTS: ZevaConfig = {
  name: "Acme Salon",
  label: "Ask Acme Salon",
  welcome:
    "Ask in your own words \u2014 every answer comes from Acme Salon\u2019s own documents.",
  subtitle: "answer engine \u00b7 grounded",
  logo: "",
  accent: "#4f46e5",
  surface: "auto",
  panelBg: "",
  corners: "soft",
  launcher: "pill",
  anchor: "bottom-right",
  offX: 24,
  offY: 24,
  glass: true,
  sources: true,
  brand: true,
  fontSrc: "preset",
  font: "system",
  gFont: "Poppins",
  cFam: "",
  cUrl: "",
  suggestions: [
    "What are your hours?",
    "How much is a haircut?",
    "Do you take walk-ins?",
  ],
};

/** Preset accent swatches with their strong variant. */
export const ACCENT_SWATCHES: { hex: string; strong: string }[] = [
  { hex: "#4f46e5", strong: "#4338ca" },
  { hex: "#0ea5e9", strong: "#0369a1" },
  { hex: "#10b981", strong: "#047857" },
  { hex: "#f43f5e", strong: "#be123c" },
  { hex: "#f59e0b", strong: "#b45309" },
  // Violet fills the purple gap in the palette. (The old near-black #111827 read
  // as a broken/invisible swatch on the dark panel; black-brand users can still
  // pick any dark colour via the custom "+" picker.)
  { hex: "#8b5cf6", strong: "#6d28d9" },
];

export const GOOGLE_FONT_SUGGESTIONS = [
  "Inter",
  "Poppins",
  "Roboto",
  "Playfair Display",
  "Space Grotesk",
  "Montserrat",
];
