/**
 * Admin dashboard ka network layer — backend ke /admin/* aur /leads /ingest
 * endpoints ko call karta hai. JWT token from Better Auth is used for auth.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { authClient } from "./auth-client";
import type { BotDesign } from "./pendingDesign";

/**
 * Get JWT token from Better Auth for authenticated API requests.
 * This token is verified by FastAPI using JWKS.
 */
async function getJwtToken(): Promise<string | null> {
  try {
    const { data } = await authClient.token();
    return data?.token ?? null;
  } catch {
    return null;
  }
}

export interface AdminBot {
  bot_id: string;
  name: string;
  accent: string;
  // Full fields returned by /admin/bots (optional so older callers and the
  // 3-field BotSwitcher shape stay compatible).
  welcome?: string;
  suggestions?: string[];
  allowed_domains?: string[];
  /** Platform-admin moderation flag (owner can't change this). */
  suspended?: boolean;
  /** Owner's own pause switch. */
  paused?: boolean;
  /** Derived: not suspended, not paused, and a valid license/trial. */
  is_active?: boolean;
  created_at?: string;
  /** Full Studio look for signed-in owners ({config, websiteUrl}); {} if unsaved. */
  design?: BotDesign | Record<string, never>;
}

export interface AdminLead {
  id: number;
  bot_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  score: "hot" | "warm" | "cold";
  created_at: string;
}

export interface Handoff {
  id: number;
  bot_id: string;
  name: string;
  contact: string;
  summary: string;
  created_at: string;
}

export interface TopQuestion {
  question: string;
  count: number;
}

export interface AdminStats {
  leads: number;
  warmLeads: number;
  chats: number;
  unanswered: number;
  topQuestions: TopQuestion[];
}

function base(): string {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL set nahi hai");
  return API_URL;
}

/**
 * Error thrown by admin API calls that carries the HTTP status code, so
 * callers can branch on it (e.g. 403 "botId already taken" during onboarding)
 * instead of string-matching a generic message.
 */
export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await getJwtToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function getJson<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${base()}${path}`, { headers });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export const ADMIN_ENABLED = Boolean(API_URL);

export async function fetchBots(): Promise<AdminBot[]> {
  return (await getJson<{ bots: AdminBot[] }>("/admin/bots")).bots;
}

export async function fetchStats(botId: string): Promise<AdminStats> {
  return getJson<AdminStats>(`/admin/stats?botId=${encodeURIComponent(botId)}`);
}

export async function fetchLeads(botId: string): Promise<AdminLead[]> {
  return (
    await getJson<{ leads: AdminLead[] }>(`/leads?botId=${encodeURIComponent(botId)}`)
  ).leads;
}

export async function fetchHandoffs(botId: string): Promise<Handoff[]> {
  return (
    await getJson<{ handoffs: Handoff[] }>(
      `/admin/handoffs?botId=${encodeURIComponent(botId)}`,
    )
  ).handoffs;
}

export interface Subscription {
  plan: string | null;
  status: string;
  // Only present once a subscription row exists — a brand-new account with
  // no bots yet gets {plan: null, status: "none"} and nothing else.
  max_bots?: number;
  max_messages_per_month?: number;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  bots_used?: number;
  messages_this_month?: number;
}

export async function fetchSubscription(): Promise<Subscription> {
  return getJson<Subscription>("/subscription");
}

/** GDPR-style delete-on-request. Backend 404s if the lead doesn't exist or isn't yours. */
export async function deleteLead(leadId: number): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${base()}/leads/${leadId}`, { method: "DELETE", headers: authHeaders });
  if (!res.ok) {
    let detail = `Delete failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      // not JSON — fall back to the generic message
    }
    throw new AdminApiError(res.status, detail);
  }
}

export interface CreateBotPayload {
  botId: string;
  name: string;
  accent?: string;
  welcome?: string;
  suggestions?: string[];
  allowedDomains?: string[];
  /** Full Studio look to persist server-side. Omit to leave the stored design
      untouched (a brand-only edit shouldn't wipe the saved look). */
  design?: BotDesign;
}

/**
 * Reserve a new bot (or upsert one already owned by the caller).
 * Backend returns 403 if botId is taken by a different owner — surfaced via
 * AdminApiError so the onboarding wizard can show a clear inline message.
 */
export async function createBot(
  payload: CreateBotPayload,
): Promise<{ ok: boolean; botId: string }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${base()}/admin/create-bot`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      // response body wasn't JSON — fall back to the generic message
    }
    throw new AdminApiError(res.status, detail);
  }
  return (await res.json()) as { ok: boolean; botId: string };
}

/** Owner pause/resume — the bot's widget goes dark without deleting anything. */
export async function setBotPaused(botId: string, paused: boolean): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${base()}/admin/pause-bot`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ botId, paused }),
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON */
    }
    throw new AdminApiError(res.status, detail);
  }
}

/** Permanently delete an owned bot + all its leads/chats/docs. Irreversible. */
export async function deleteBot(botId: string): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${base()}/admin/bots/${encodeURIComponent(botId)}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  if (!res.ok) {
    let detail = `Delete failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON */
    }
    throw new AdminApiError(res.status, detail);
  }
}

export async function ingestDoc(
  botId: string,
  filename: string,
  text: string,
): Promise<{ chunks: number; files: number }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${base()}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ botId, filename, text }),
  });
  if (!res.ok) throw new Error(`Ingest failed (${res.status})`);
  return (await res.json()) as { chunks: number; files: number };
}

export interface IngestFileResult {
  ok: boolean;
  filename: string;
  chars: number;
  chunks: number;
  files: number;
}

/**
 * Upload a real knowledge file (PDF / Word .docx / text / Markdown / PNG / JPG).
 * The backend extracts the text (documents via parsers, images via a vision
 * model), then chunks + embeds it. Note: we do NOT set Content-Type — the
 * browser sets the multipart boundary for FormData automatically.
 */
export async function uploadKnowledgeFile(
  botId: string,
  file: File,
): Promise<IngestFileResult> {
  const authHeaders = await getAuthHeaders();
  const form = new FormData();
  form.append("botId", botId);
  form.append("file", file);
  const res = await fetch(`${base()}/ingest-file`, {
    method: "POST",
    headers: authHeaders,
    body: form,
  });
  if (!res.ok) {
    let detail = `Upload failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON */
    }
    throw new AdminApiError(res.status, detail);
  }
  return (await res.json()) as IngestFileResult;
}
