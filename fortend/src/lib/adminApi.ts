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
  notification_email?: string | null;
  webhook_url?: string | null;
  google_sheets_url?: string | null;
  whatsapp_phone_number_id?: string | null;
  model_override?: string | null;
  custom_prompt_style?: string | null;
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
  custom_data?: Record<string, any>;
  created_at: string;
}

export interface PlaygroundSession {
  id: string;
  title: string;
  messages: any[]; // Or PlaygroundMsg[] if imported, but any is safe here
  updated_at: string;
}

export interface Handoff {
  id: number;
  bot_id: string;
  bot_name: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  message: string | null;
  score: "hot" | "warm" | "cold" | null;
  summary: string | null;
  status: "pending" | "actioned" | "ignored" | null;
  created_at: string;
}

export interface SystemStatus {
  app_dir_ok: boolean;
  database: "sqlite" | "postgres_neon";
  neon_url_set: boolean;
  openai_key_set: boolean;
  chromedriver_found: boolean;
  data: {
    bots: number;
    leads: number;
    chats: number;
  };
}

export interface DocumentMeta {
  source_file: string;
  chunks: number;
  created_at?: string | null;
}

export interface AdminBotFull extends AdminBot {
  documents: DocumentMeta[];
  stats: {
    total_leads: number;
    total_chats: number;
    hot_leads: number;
  };
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
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  return API_URL;
}

/** Shown whenever a request can't reach the backend at all — kept in one
 *  place so a wording fix doesn't need a find-and-replace across the file. */
const NETWORK_ERROR_MESSAGE = "We can't connect right now. Check your internet connection and try again.";



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
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, { headers });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const errBody = (await res.json()) as { detail?: string };
      if (errBody?.detail) detail = errBody.detail;
    } catch {
      /* non-JSON */
    }
    throw new AdminApiError(res.status, detail);
  }
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

/** Self-serve plans a paying owner can pick in the upgrade flow. */
export type BillingPlan = "starter" | "pro" | "business" | "enterprise";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const authHeaders = await getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const errBody = (await res.json()) as { detail?: string };
      if (errBody?.detail) detail = errBody.detail;
    } catch {
      /* non-JSON */
    }
    throw new AdminApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

/** Ingests an industry template's starter knowledge base into a freshly
 *  created bot. Hits the signed-in "/admin/apply-template" route (auth +
 *  per-user rate limit) via postJson, not the public "/demo/apply-template"
 *  path the create-bot modal was previously calling with a bare fetch. */
export async function applyIndustryTemplate(payload: {
  botId: string;
  templateId: string;
  knowledgeText: string;
  name: string;
  accent: string;
  welcome: string;
  suggestions: string[];
}): Promise<void> {
  await postJson<{ ok: boolean }>("/admin/apply-template", payload);
}

/**
 * Global (non-India) checkout — creates a Stripe Checkout Session and
 * returns its hosted-page URL; the caller redirects the browser there.
 * Throws AdminApiError(400) if the plan has no Stripe price configured yet
 * (e.g. "enterprise" before a self-serve price exists — callers should fall
 * back to a "contact sales" link in that case).
 */
export async function createStripeCheckoutSession(
  plan: BillingPlan,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const { url } = await postJson<{ url: string }>("/billing/stripe/create-checkout-session", {
    plan,
    successUrl,
    cancelUrl,
  });
  return url;
}

/**
 * India checkout — creates a Razorpay Subscription; the caller opens
 * Razorpay Checkout.js against the returned subscriptionId/keyId (see
 * BillingCard.tsx). Throws AdminApiError(400) if the plan has no Razorpay
 * plan configured yet.
 */
export async function createRazorpaySubscription(
  plan: BillingPlan,
): Promise<{ subscriptionId: string; keyId: string }> {
  return postJson<{ subscriptionId: string; keyId: string }>(
    "/billing/razorpay/create-subscription",
    { plan },
  );
}

/** GDPR-style delete-on-request. Backend 404s if the lead doesn't exist or isn't yours. */
export async function deleteLead(leadId: number): Promise<void> {
  const authHeaders = await getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`${base()}/leads/${leadId}`, { method: "DELETE", headers: authHeaders });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
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
  botId?: string;
  name: string;
  accent?: string;
  welcome?: string;
  suggestions?: string[];
  allowedDomains?: string[];
  notificationEmail?: string;
  webhookUrl?: string;
  googleSheetsUrl?: string;
  whatsappPhoneNumberId?: string;
  modelOverride?: string;
  customPromptStyle?: string;
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
  let res: Response;
  try {
    res = await fetch(`${base()}/admin/create-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[adminApi] createBot fetch failed:", err);
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
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
  let res: Response;
  try {
    res = await fetch(`${base()}/admin/pause-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ botId, paused }),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
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
  let res: Response;
  try {
    res = await fetch(`${base()}/admin/bots/${encodeURIComponent(botId)}`, {
      method: "DELETE",
      headers: authHeaders,
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
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
  let res: Response;
  try {
    res = await fetch(`${base()}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ botId, filename, text }),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) throw new Error("We couldn't process that text — try again in a moment.");
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
  let res: Response;
  try {
    res = await fetch(`${base()}/ingest-file`, {
      method: "POST",
      headers: authHeaders,
      body: form,
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
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

export interface AdminDoc {
  filename: string;
  size: number;
  chars: number;
  updatedAt: number;
}

export async function fetchDocs(botId: string): Promise<AdminDoc[]> {
  return (await getJson<{ docs?: AdminDoc[] }>(`/admin/docs?botId=${encodeURIComponent(botId)}`)).docs ?? [];
}

export async function deleteDocFile(botId: string, filename: string): Promise<void> {
  const authHeaders = await getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(
      `${base()}/admin/docs?botId=${encodeURIComponent(botId)}&filename=${encodeURIComponent(filename)}`,
      {
        method: "DELETE",
        headers: authHeaders,
      },
    );
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) throw new Error("We couldn't delete that document — try again in a moment.");
}

export async function executeSubjectErasure(targetIdentifier: string): Promise<{ ok: boolean; status: string; purged: { leads: number; chats: number } }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${base()}/api/privacy/erasure-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ target_identifier: targetIdentifier }),
  });
  if (!res.ok) throw new Error("We couldn't delete this person's data — try again in a moment.");
  return res.json();
}

export async function exportTenantData(): Promise<any> {
  return (await getJson<{ export: any }>("/api/privacy/export-data")).export;
}

export interface LiveSessionMessage {
  sender: "visitor" | "agent" | "system";
  text: string;
  timestamp: number;
  sessionId?: string;
}

export interface LiveChatSession {
  sessionId: string;
  botId: string;
  isAiOverridden: boolean;
  messages: LiveSessionMessage[];
  lastActive: number;
  status: "live-takeover" | "ai-automated";
}

export async function fetchLiveSessions(botId: string): Promise<LiveChatSession[]> {
  const data = await getJson<{ ok: boolean; sessions: LiveChatSession[] }>(
    `/api/live-chat/sessions?botId=${encodeURIComponent(botId)}`
  );
  return data.sessions || [];
}

export async function toggleLiveTakeover(sessionId: string, enable: boolean): Promise<{ ok: boolean; isAiOverridden: boolean }> {
  return postJson<{ ok: boolean; isAiOverridden: boolean }>(
    `/api/live-chat/${encodeURIComponent(sessionId)}/takeover`,
    { enable }
  );
}

export async function sendLiveChatMessage(sessionId: string, text: string, sender: "agent" | "system" = "agent"): Promise<void> {
  await postJson(`/api/live-chat/${encodeURIComponent(sessionId)}/message`, { text, sender });
}

// ============================================================================
// Playground Sessions API
// ============================================================================

export async function fetchPlaygroundSessions(botId: string): Promise<PlaygroundSession[]> {
  return (await getJson<{ sessions: PlaygroundSession[] }>(`/admin/playground-sessions?botId=${encodeURIComponent(botId)}`)).sessions;
}

export async function upsertPlaygroundSession(
  botId: string, 
  id: string, 
  title: string, 
  messages: any[]
): Promise<void> {
  const token = await getJwtToken();
  const url = `${API_URL}/admin/playground-sessions?botId=${encodeURIComponent(botId)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ id, title, messages }),
  });

  if (!res.ok) {
    let errText = await res.text();
    throw new Error(`Failed to save playground session: ${errText}`);
  }
}

export async function deletePlaygroundSession(botId: string, sessionId: string): Promise<void> {
  const token = await getJwtToken();
  const url = `${API_URL}/admin/playground-sessions/${encodeURIComponent(sessionId)}?botId=${encodeURIComponent(botId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let errText = await res.text();
    throw new Error(`Failed to delete playground session: ${errText}`);
  }
}
