import type { KbEntry } from "./types";

/** Demo knowledge base — keep injectable, not hardcoded in a component. */
export const DEMO_KB: KbEntry[] = [
  {
    keys: ["hour", "open", "close", "time", "when"],
    answer: "We're open Monday to Saturday, 10 AM\u20137 PM, and closed on Sundays.",
    file: "hours.pdf",
    match: 96,
    snip: "Store hours \u2014 Acme Salon is open Monday to Saturday, 10:00 AM to 7:00 PM. Closed Sundays and public holidays.",
    hi: "Acme Salon is open Monday to Saturday, 10:00 AM to 7:00 PM.",
  },
  {
    keys: ["price", "cost", "haircut", "how much", "pricing", "rate"],
    answer: "A haircut starts at \u20b9499, and hair color starts at \u20b91,499.",
    file: "pricing.pdf",
    match: 93,
    snip: "Services & pricing \u2014 Haircut from \u20b9499. Hair color from \u20b91,499. Full styling package \u20b92,999.",
    hi: "Haircut from \u20b9499. Hair color from \u20b91,499.",
  },
  {
    keys: ["walk", "appointment", "slot"],
    answer: "Walk-ins are welcome \u2014 on weekends we suggest booking ahead so you don't wait.",
    file: "faq.pdf",
    match: 90,
    snip: "Do you take walk-ins? Yes \u2014 walk-ins are always welcome. On weekends we recommend booking ahead to avoid a wait.",
    hi: "walk-ins are always welcome. On weekends we recommend booking ahead",
  },
  {
    keys: ["color", "colour", "highlight", "balayage"],
    answer: "Yes \u2014 global color, highlights, and balayage. Color starts at \u20b91,499.",
    file: "services.pdf",
    match: 92,
    snip: "Color menu \u2014 global color, highlights, balayage and root touch-ups. Color services start at \u20b91,499.",
    hi: "Color services start at \u20b91,499.",
  },
  {
    keys: ["where", "location", "address", "parking", "find"],
    answer: "We\u2019re in Phase 7 Market, Mohali, with free parking behind the building.",
    file: "contact.pdf",
    match: 88,
    snip: "Find us \u2014 Acme Salon, Phase 7 Market, Mohali. Free customer parking behind the building.",
    hi: "Phase 7 Market, Mohali. Free customer parking behind the building.",
  },
];

export const DEMO_SUGGESTIONS = [
  "What are your hours?",
  "How much is a haircut?",
  "Do you take walk-ins?",
];

/** Simple keyword matcher — returns the first matching KB entry or null. */
export function matchKb(query: string, kb: KbEntry[] = DEMO_KB): KbEntry | null {
  const low = query.toLowerCase();
  return kb.find((e) => e.keys.some((k) => low.includes(k))) ?? null;
}

/** Highlight a substring in a snippet with <mark> tags. */
export function highlightSnip(snip: string, hi: string): string {
  const i = snip.indexOf(hi);
  if (i < 0) return snip;
  return snip.slice(0, i) + "<<<MARK>>>" + hi + "<<<MARK>>>" + snip.slice(i + hi.length);
}
