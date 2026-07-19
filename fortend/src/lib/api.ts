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

/** fetch with a timeout so a hung backend doesn't hang the widget forever. */
async function fetchJson(url: string, body: unknown, ms = 45_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Local demo resolution against the injected knowledge base. */
function mockChat(req: ChatRequest): ChatResponse {
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
 * - REAL mode (API_URL set): POST to the FastAPI backend's /chat.
 *   Phase 3 backend returns { reply }; a later RAG backend returns
 *   { answer, sources } — both are handled here.
 * - MOCK mode: resolve against DEMO_KB (studio design preview).
 */
export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  if (API_URL) {
    const data = (await fetchJson(`${API_URL}/chat`, {
      message: req.message,
      botId: req.botId,
    })) as {
      reply?: string;
      answer?: string;
      sources?: ChatSource[];
      isGuardrail?: boolean;
    };
    return {
      answer: data.answer ?? data.reply ?? "",
      sources: data.sources ?? [],
      // RAG backend sets this when nothing relevant was found in the documents.
      isGuardrail: data.isGuardrail ?? false,
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
  if (API_URL) {
    return (await fetchJson(`${API_URL}/lead`, payload, 15_000)) as LeadResponse;
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
  const res = await fetch(`${API_URL}/config?botId=${encodeURIComponent(botId)}`);
  if (!res.ok) throw new Error(`Config load failed (${res.status})`);
  return (await res.json()) as BotPublicConfig;
}

/** True when a real backend is configured (vs mock/demo mode). */
export const HAS_BACKEND = Boolean(API_URL);
