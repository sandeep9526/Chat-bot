/**
 * Superadmin panel's network layer — calls the backend's /superadmin/*
 * routes. These are gated server-side by PLATFORM_ADMIN_EMAILS, not by
 * anything this file does — a non-admin caller gets a real 403 from the
 * backend regardless of what this client sends. Mirrors adminApi.ts's
 * JWT-header pattern.
 */
import { authClient } from "./auth-client";
import { AdminApiError } from "./adminApi";

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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const { data } = await authClient.token();
    if (data?.token) headers["Authorization"] = `Bearer ${data.token}`;
  } catch {
    // no session — request goes out unauthenticated and the backend 401s
  }
  return headers;
}

async function handleErrors(res: Response): Promise<void> {
  if (res.ok) return;
  let detail = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as { detail?: string };
    if (body?.detail) detail = body.detail;
  } catch {
    // body wasn't JSON — fall back to the generic message
  }
  throw new AdminApiError(res.status, detail);
}

async function getJson<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${base()}${path}`, { headers });
  await handleErrors(res);
  return (await res.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(body),
  });
  await handleErrors(res);
  return (await res.json()) as T;
}

/* ─────────────────────────── Interfaces ─────────────────────────── */

export interface PlatformBot {
  bot_id: string;
  name: string;
  accent: string;
  owner_user_id: string | null;
  owner_email: string | null;
  created_at: string;
  suspended: boolean;
  plan: string | null;
  status: string | null;
  is_active: boolean;
}

export interface PlatformStats {
  totalBots: number;
  totalOwners: number;
  totalLeads: number;
  totalChats: number;
  byPlan: Record<string, number>;
}

export interface PlatformUser {
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
  plan: string | null;
  status: string | null;
  max_bots: number | null;
  max_messages_per_month: number | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  bot_count: number;
}

export interface PlatformLead {
  id: number;
  bot_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  score: number | null;
  created_at: string;
  summary: string | null;
}

export interface PlatformChatStat {
  bot_id: string;
  bot_name: string;
  owner_email: string | null;
  total_chats: number;
  total_sessions: number;
  top_question: string | null;
  unanswered_count: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface BotPerformance {
  bot_id: string;
  bot_name: string;
  owner_email: string | null;
  sessions: number;
  messages: number;
  leads: number;
  hot_leads: number;
  warm_leads: number;
  conversion_rate: number;
}

export interface FunnelData {
  total_sessions: number;
  total_messages: number;
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  lead_capture_rate: number;
  hot_rate: number;
}

export interface SessionMetrics {
  avg_messages_per_session: number;
  median_messages_per_session: number;
}

export interface PlatformHealth {
  total_bots: number;
  active_bots: number;
  suspended_bots: number;
  unanswered_messages: number;
  unanswered_rate: number;
}

export interface PlatformAnalytics {
  funnel: FunnelData;
  daily_chats: TimeSeriesPoint[];
  daily_leads: TimeSeriesPoint[];
  daily_signups: TimeSeriesPoint[];
  bot_performance: BotPerformance[];
  session_metrics: SessionMetrics;
  platform_health: PlatformHealth;
}

/* ─────────────────────────── API functions ───────────────────────── */

export async function checkPlatformAdmin(): Promise<{ is_admin: boolean; email: string }> {
  return getJson("/superadmin/check");
}

export async function fetchAllBots(): Promise<PlatformBot[]> {
  return (await getJson<{ bots: PlatformBot[] }>("/superadmin/bots")).bots;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  return getJson<PlatformStats>("/superadmin/stats");
}

export async function fetchAllUsers(): Promise<PlatformUser[]> {
  return (await getJson<{ users: PlatformUser[] }>("/superadmin/users")).users;
}

export async function fetchAllLeads(): Promise<PlatformLead[]> {
  return (await getJson<{ leads: PlatformLead[] }>("/superadmin/leads")).leads;
}

export async function fetchAllChats(): Promise<PlatformChatStat[]> {
  return (await getJson<{ chats: PlatformChatStat[] }>("/superadmin/chats")).chats;
}

export async function fetchAnalytics(): Promise<PlatformAnalytics> {
  return getJson<PlatformAnalytics>("/superadmin/analytics");
}

export async function suspendBot(botId: string, suspended: boolean): Promise<void> {
  await postJson("/superadmin/suspend-bot", { botId, suspended });
}

export const VALID_PLANS = ["trial", "starter", "pro", "business", "enterprise"] as const;
export const VALID_STATUSES = ["trialing", "active", "past_due", "canceled", "expired"] as const;

export async function setOwnerPlan(
  ownerUserId: string,
  plan: (typeof VALID_PLANS)[number],
  status: (typeof VALID_STATUSES)[number],
): Promise<void> {
  await postJson("/superadmin/set-plan", { ownerUserId, plan, status });
}

export async function deleteUser(userId: string): Promise<{ ok: boolean; deleted_bots: string[] }> {
  return postJson("/superadmin/delete-user", { userId, confirm: true });
}
