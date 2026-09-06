/**
 * Utilities for cleaning, decoding HTML entities, and applying strict guardrails
 * to bot names and welcome greetings fetched from website metadata.
 */

/**
 * Decodes standard and numeric HTML entities.
 * e.g. "&#x27;" -> "'", "&amp;" -> "&", "&quot;" -> '"'
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";

  // Common named entities
  let text = str
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&copy;/gi, "©")
    .replace(/&reg;/gi, "®")
    .replace(/&trade;/gi, "™");

  // Hexadecimal numeric entities: &#xHH;
  text = text.replace(/&#x([0-9a-f]{1,6});/gi, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return "";
    }
  });

  // Decimal numeric entities: &#NNN;
  text = text.replace(/&#([0-9]{1,7});/gi, (_, dec) => {
    try {
      return String.fromCodePoint(parseInt(dec, 10));
    } catch {
      return "";
    }
  });

  return text;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strict guardrail for brand/agent names.
 * Ensures short, clean brand name without slogans, colons, or taglines (max 25 chars).
 */
export function sanitizeBrandName(rawName: string, fallback: string = "Assistant"): string {
  if (!rawName) return fallback;

  let name = decodeHtmlEntities(rawName).trim();

  // Split on common SEO/title separators: :, |, —, –, •, ·, », //, or " - "
  const delimiters = [":", "|", "—", "–", " - ", " · ", " • ", " » ", " // "];
  for (const delim of delimiters) {
    if (name.includes(delim)) {
      name = name.split(delim)[0].trim();
    }
  }

  // Strip common introductory prefixes like "Assistant for", "Welcome to", etc.
  name = name.replace(/^(hi,?\s*i'?m\s*(the\s*)?(assistant\s*for\s*)?|welcome\s*to\s*|the\s*official\s*)/i, "").trim();

  // Strip excess punctuation and spacing
  name = name.replace(/\s+/g, " ").replace(/^[:|\-—–·•.,'"\s]+|[:|\-—–·•.,'"\s]+$/g, "").trim();

  // If still too long (> 25 chars), try to take the first 1-2 words if meaningful, else truncate
  if (name.length > 25) {
    const words = name.split(" ");
    if (words[0] && words[0].length >= 2 && words[0].length <= 25) {
      name = words[0];
    } else {
      name = name.slice(0, 25).trim();
    }
  }

  return name.length >= 2 ? name : fallback;
}

/**
 * Strict guardrail for welcome messages.
 * Produces a warm, clean, concise 1-sentence greeting under 100 chars without stuttered prefixes or repetition.
 */
export function sanitizeWelcomeMessage(rawWelcome: string, brand: string): string {
  const safeBrand = brand || "our team";
  if (!rawWelcome) {
    return `Hi! Welcome to ${safeBrand}. How can I help you today?`;
  }

  let welcome = decodeHtmlEntities(rawWelcome).trim();

  // Strip HTML tags
  welcome = welcome.replace(/<[^>]*>?/gm, "").trim();

  // Strip stuttered introductory prefixes like "Hi! I'm the assistant for Woblo. "
  welcome = welcome.replace(/^(hi|hello|hey)[!.,]?\s*(i'?m|i\s*am)?\s*(the\s*)?(ai\s*)?assistant\s*for\s*[^.!?]+[.!?]\s*/i, "").trim();
  welcome = welcome.replace(/^(i'?m|i\s*am)\s*(the\s*)?(ai\s*)?assistant\s*for\s*[^.!?]+[.!?]\s*/i, "").trim();

  // Strip any taglines or colons/pipes attached to brand name
  const brandPattern = new RegExp(`${escapeRegExp(safeBrand)}\\s*[:|—–]\\s*[^.!?\\n]+`, "i");
  welcome = welcome.replace(brandPattern, safeBrand);

  // If truncated with ellipsis (...), cut back to the last complete sentence
  if (welcome.includes("...")) {
    const beforeDots = welcome.split("...")[0].trim();
    const lastPunct = Math.max(beforeDots.lastIndexOf("."), beforeDots.lastIndexOf("!"), beforeDots.lastIndexOf("?"));
    if (lastPunct > 15) {
      welcome = beforeDots.slice(0, lastPunct + 1).trim();
    } else {
      welcome = `Hi! Welcome to ${safeBrand}. How can I help you today?`;
    }
  }

  // If message contains colons, pipes, or repeats the brand name, simplify to standard clean greeting
  const brandCount = (welcome.toLowerCase().match(new RegExp(escapeRegExp(safeBrand.toLowerCase()), "g")) || []).length;
  if (welcome.length > 100 || brandCount > 1 || welcome.includes(":") || welcome.includes("|")) {
    welcome = `Hi! Welcome to ${safeBrand}. How can I help you today?`;
  }

  // Ensure message starts with a greeting
  if (!/^(hi|hello|welcome|hey)\b/i.test(welcome)) {
    welcome = `Hi! Welcome to ${safeBrand}. ${welcome}`;
  }

  // If very short (e.g. "Welcome to Woblo!"), add a helpful call-to-action
  if (welcome.toLowerCase() === `welcome to ${safeBrand.toLowerCase()}!` || welcome.length < 24) {
    welcome = welcome.replace(/[.!]+$/, "") + "! How can I help you today?";
  }

  // Guarantee final punctuation
  if (!/[.!?]$/.test(welcome)) {
    welcome += ".";
  }

  return welcome;
}

const DISALLOWED_QUESTION_PATTERNS = [
  /delete.*account/i, /account.*delet/i, /data.*delet/i, /cancel.*subscript/i, /cancel.*account/i, /\brefund/i,
  /privacy.*polic/i, /data.*collect/i, /\bgdpr\b/i, /terms.*of.*service/i, /\btos\b/i, /\blegal\b/i, /cookie.*polic/i,
  /sign-?in.*fail/i, /login.*fail/i, /won'?t\s+start/i, /\bfails?\b/i, /\berror\b/i, /\bbug\b/i, /\bbroken\b/i,
  /not\s+working/i, /\bcrash\b/i, /password.*reset/i, /\bhelp!/i, /why\s+won'?t/i, /why\s+can'?t\s+i/i,
  /who\s+created\b/i
];

/**
 * Strict guardrail to ensure only high-intent, relevant customer questions are displayed.
 * Filters out negative troubleshooting complaints, bugs, legal terms, and deletion questions.
 */
export function sanitizeSuggestions(rawSuggestions: any[], botName?: string): string[] {
  if (!Array.isArray(rawSuggestions)) return [];

  const curated: string[] = [];
  const seen = new Set<string>();

  for (const item of rawSuggestions) {
    let q = decodeHtmlEntities(String(item || "")).trim();
    // Strip leading numbering or bullet points
    q = q.replace(/^\d+[\.\)]\s*/, "").replace(/^[-•*]\s*/, "").trim();
    if (!q) continue;

    // Check if question violates disallowed patterns
    const isDisallowed = DISALLOWED_QUESTION_PATTERNS.some((pattern) => pattern.test(q));
    if (isDisallowed) continue;

    // Fix length and sentence structure
    if (q.length > 60) {
      const parts = q.split(/[?,;]/);
      if (parts[0] && parts[0].trim().length >= 12) {
        q = parts[0].trim() + "?";
      }
    }
    if (!q.endsWith("?")) {
      q += "?";
    }

    const key = q.toLowerCase();
    if (q.length >= 12 && q.length <= 65 && !seen.has(key)) {
      curated.push(q);
      seen.add(key);
    }
  }

  // If fewer than 3 questions remain, add high-value commercial fallbacks
  if (curated.length < 3 && botName) {
    const fallbacks = [
      `What features does ${botName} offer?`,
      `What are the pricing plans for ${botName}?`,
      `What formats can I export to?`,
      `How do I get started with ${botName}?`,
      `Which browsers and platforms are supported?`,
    ];
    for (const fb of fallbacks) {
      if (curated.length >= 4) break;
      if (!seen.has(fb.toLowerCase())) {
        curated.push(fb);
        seen.add(fb.toLowerCase());
      }
    }
  }

  return curated.slice(0, 5);
}

