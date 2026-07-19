/** Darken a hex colour by `amt` (0–1). Used for --accent-strong. */
export function shade(hex: string, amt = 0.16): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/**
 * Is this hex colour light enough that DARK text reads well on it? Used by the
 * panel to pick its own text theme from the chosen panel background — a dark
 * panel gets light text (data-theme="dark"), a light panel gets dark text —
 * independent of the page/surface theme. Uses perceived (sRGB-weighted)
 * brightness; unparseable input falls back to "light" (dark text) as the safe
 * default. Returns null for an empty value so callers can skip theming.
 */
export function isLightColor(hex: string): boolean | null {
  if (!hex) return null;
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return true;
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Perceived brightness (0–1). 0.6 threshold biases mid-tones toward light
  // text (dark theme), which reads better on saturated brand colours.
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

/** Compute effective theme from surface mode + system preference. */
export function effectiveTheme(
  surface: "auto" | "light" | "dark",
  prefersDark: boolean,
): "light" | "dark" {
  if (surface === "auto") return prefersDark ? "dark" : "light";
  return surface;
}
