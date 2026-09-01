/**
 * Network layer for the widget.
 *
 * Single place where the studio's demo (mock) mode and the real backend are
 * swapped. If NEXT_PUBLIC_API_URL is set, we call the FastAPI backend; otherwise
 * we resolve locally against the demo knowledge base. The React Query hooks
 * (`useSendMessage`, `useSubmitLead`) only call these functions — components
 * never learn which mode they're in.
 */
import type {
  ChatRequest,
  ChatResponse,
  ChatSource,
  LeadPayload,
  LeadResponse,
} from "./types";
import { matchKb } from "./knowledge";

/** Backend base URL (e.g. http://127.0.0.1:8000). Unset → mock mode. */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function base(): string {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  if (typeof window !== "undefined" && window.location.protocol === "https:" && API_URL.startsWith("http://")) {
    throw new Error(
      "Mixed content blocked: page is HTTPS but API is HTTP. Open http://localhost:3000 instead of https://"
    );
  }
  return API_URL;
}

/** Reduced-motion → shorter simulated latency, matching the prototype. */
function scanDelayMs(): number {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduce ? 150 : 760;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { authClient } from "./auth-client";

/** Distinguishes *why* a request failed, so the UI can show an accurate message. */
export type ChatErrorKind = "offline" | "timeout" | "rate_limited" | "server" | "network";

export class ChatRequestError extends Error {
  kind: ChatErrorKind;
  status?: number;
  constructor(kind: ChatErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ChatRequestError";
    this.kind = kind;
    this.status = status;
  }
}

/**
 * Best-effort JWT fetch. Retried once (short backoff) before giving up, so a
 * single transient blip doesn't silently drop auth for the whole session.
 * Logs on final failure — an unauthenticated request should never be a silent
 * no-op in production, even though the request itself still proceeds.
 */
async function getJwtToken(): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data } = await authClient.token();
      return data?.token ?? null;
    } catch (err) {
      if (attempt === 0) {
        await wait(300);
        continue;
      }
      console.error(
        "[auth] Couldn't fetch a session token after retrying — sending request unauthenticated.",
        err,
      );
      return null;
    }
  }
  return null;
}

/** fetch with a timeout so a hung backend doesn't hang the widget forever. */
async function fetchJson(url: string, body: unknown, ms = 45_000) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new ChatRequestError("offline", "You appear to be offline.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const token = await getJwtToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ChatRequestError("timeout", "The request took too long to respond.");
      }
      throw new ChatRequestError("network", "Couldn't reach the server.");
    }

    if (!res.ok) {
      if (res.status === 429) {
        throw new ChatRequestError("rate_limited", "Too many requests.", res.status);
      }
      throw new ChatRequestError("server", `Backend responded ${res.status}`, res.status);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

import { INDUSTRY_TEMPLATES } from "./templates";

const ZEVA_AI_KB = [
  {
    keys: ["install", "embed", "script", "code", "add", "website", "setup", "widget"],
    answer: "Installing ochreshift is as simple as pasting a 1-line JavaScript snippet (`<script src=\"https://cdn.ochreshift.app/widget.js\" data-bot-id=\"YOUR_BOT_ID\"></script>`) right before the `</body>` tag of your website HTML.",
    file: "widget_installation.pdf",
    match: 98,
    snip: "Installation Guide — Copy your 1-line embed script from ochreshift Studio and paste it right before the closing </body> tag on your website.",
    hi: "Copy your 1-line embed script from ochreshift Studio and paste it right before the closing </body> tag",
  },
  {
    keys: ["zeva", "what is zeva", "about zeva", "platform", "who are you"],
    answer: "ochreshift is an intelligent RAG-powered chatbot platform that grounds every answer strictly in your company's official documents, eliminating AI hallucinations and capturing leads 24/7.",
    file: "zeva_overview.pdf",
    match: 97,
    snip: "ochreshift Platform — Autonomous AI chatbot grounded in real business documents. Prevents hallucinations and captures qualified leads.",
    hi: "Autonomous AI chatbot grounded in real business documents.",
  },
  {
    keys: ["price", "pricing", "plan", "cost", "free", "tier", "subscription"],
    answer: "ochreshift offers flexible plans: Starter ($29/mo), Pro ($79/mo with full white-labeling & Google Sheets sync), and custom Enterprise plans.",
    file: "zeva_pricing.pdf",
    match: 95,
    snip: "ochreshift Plans & Pricing — Starter $29/mo, Pro $79/mo with white-labeling and unlimited chats, Enterprise custom SLA.",
    hi: "Starter $29/mo, Pro $79/mo with white-labeling",
  },
];

/** Local demo resolution against template knowledge base or DEMO_KB. */
function mockChat(req: ChatRequest): ChatResponse {
  const q = req.message.toLowerCase().trim();
  const isZevaBot =
    !req.botId ||
    req.botId === "zeva-ai" ||
    (req.name && req.name.toLowerCase() === "zeva ai") ||
    (!req.botId?.startsWith("demo-") && !INDUSTRY_TEMPLATES.some((t) => req.name && req.name.toLowerCase().includes(t.botName.toLowerCase())));

  // 1. If it's default Zeva AI bot or asking a Zeva question, check Zeva AI knowledge base first
  if (isZevaBot) {
    const zevaMatch = ZEVA_AI_KB.find((entry) => entry.keys.some((k) => q.includes(k)));
    if (zevaMatch) {
      return {
        answer: zevaMatch.answer,
        sources: [
          {
            file: zevaMatch.file,
            match: zevaMatch.match,
            snip: zevaMatch.snip,
            highlight: zevaMatch.hi,
          },
        ],
        isGuardrail: false,
      };
    }
  }

  // 2. Try matching against active industry template knowledge
  const tmpl = INDUSTRY_TEMPLATES.find(
    (t) =>
      (req.botId && (req.botId === t.id || req.botId === `demo-${t.id}`)) ||
      (req.name && req.name.toLowerCase().includes(t.name.toLowerCase())) ||
      (req.name && req.name.toLowerCase().includes(t.botName.toLowerCase()))
  );

  if (tmpl && tmpl.knowledgeText) {
    const lines = tmpl.knowledgeText.split("\n").filter((l) => l.trim().length > 0);
    const qWords = q.split(/\s+/).filter((w) => w.length > 2);

    let bestLine = "";
    let bestScore = 0;
    let contextBlock = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLow = line.toLowerCase();
      let score = 0;
      for (const w of qWords) {
        if (lineLow.includes(w)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestLine = line;
        const prev = lines[i - 1] || "";
        const next = lines[i + 1] || "";
        contextBlock = [prev, line, next].filter(Boolean).join(" ");
      }
    }

    if (bestScore > 0 && contextBlock) {
      return {
        answer: contextBlock.replace(/^[-•]\s*/gm, "").trim(),
        sources: [
          {
            file: `${tmpl.id}_official_guide.pdf`,
            match: Math.min(98, 85 + bestScore * 4),
            snip: bestLine.slice(0, 180),
            highlight: bestLine.slice(0, 80),
          },
        ],
        isGuardrail: false,
      };
    }
  }

  // 3. Generic KB match fallback
  const match = matchKb(req.message);
  if (match) {
    return {
      answer: match.answer,
      sources: [
        {
          file: match.file,
          match: match.match,
          snip: match.snip,
          highlight: match.hi,
        },
      ],
      isGuardrail: false,
    };
  }
  return {
    answer: `I couldn’t find that in ${
      req.name ?? "your"
    }’s documents — so I won’t guess. Let me hand you to the team instead.`,
    sources: [],
    isGuardrail: true,
  };
}

/**
 * Send a chat message.
 * - REAL mode (API_URL set): POST to the FastAPI backend's /chat. A failure here
 *   is rethrown (as ChatRequestError) rather than masked — silently falling back
 *   to demo/template knowledge would show visitors a plausible-looking fake
 *   answer while hiding a real backend outage from you.
 * - MOCK mode (no API_URL): resolves against the local demo knowledge base.
 */
export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  if (req.botId === "preview") {
    await wait(scanDelayMs());
    return {
      answer: `I'm still learning! Save me to start chatting. (You asked: "${req.message}")`,
      sources: [],
      isGuardrail: false,
      limitReached: false,
    };
  }

  if (API_URL) {
    const data = (await fetchJson(`${base()}/chat`, {
      message: req.message,
      botId: req.botId,
    })) as {
      reply?: string;
      answer?: string;
      sources?: ChatSource[];
      isGuardrail?: boolean;
      limitReached?: boolean;
    };
    if (!data || (!data.answer && !data.reply)) {
      throw new ChatRequestError("server", "Backend returned an unexpected response.");
    }
    return {
      answer: data.answer ?? data.reply ?? "",
      sources: data.sources ?? [],
      isGuardrail: data.isGuardrail ?? false,
      limitReached: data.limitReached ?? false,
    };
  }

  await wait(scanDelayMs());
  return mockChat(req);
}

/**
 * Submit a captured lead.
 * - REAL mode: POST to the backend's /lead (saves to the DB).
 * - MOCK mode: resolve optimistically.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadResponse> {
  if (payload.botId === "preview") {
    await wait(800);
    return { ok: true };
  }

  if (API_URL) {
    return (await fetchJson(`${base()}/lead`, payload, 15_000)) as LeadResponse;
  }
  await wait(200);
  return { ok: Boolean(payload.name && payload.email) };
}

/** A bot's public config — the widget brands itself from this at load. */
export interface BotPublicConfig {
  botId: string;
  name: string;
  accent: string;
  welcome: string;
  suggestions: string[];
}

/** Fetch a bot's public config from the backend (real mode only). */
export async function fetchBotConfig(botId: string): Promise<BotPublicConfig> {
  if (!API_URL) throw new Error("No backend configured");
  const res = await fetch(`${base()}/config?botId=${encodeURIComponent(botId)}`);
  if (!res.ok) throw new Error(`Config load failed (${res.status})`);
  return (await res.json()) as BotPublicConfig;
}

/** True when a real backend is configured (vs mock/demo mode). */
export const HAS_BACKEND = Boolean(API_URL);
