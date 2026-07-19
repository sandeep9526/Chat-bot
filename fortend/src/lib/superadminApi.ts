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
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL set nahi hai");
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

export async function fetchAllBots(): Promise<PlatformBot[]> {
  return (await getJson<{ bots: PlatformBot[] }>("/superadmin/bots")).bots;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  return getJson<PlatformStats>("/superadmin/stats");
}

export async function suspendBot(botId: string, suspended: boolean): Promise<void> {
  await postJson("/superadmin/suspend-bot", { botId, suspended });
}

export const VALID_PLANS = ["trial", "starter", "pro", "business"] as const;
export const VALID_STATUSES = ["trialing", "active", "past_due", "canceled", "expired"] as const;

export async function setOwnerPlan(
  ownerUserId: string,
  plan: (typeof VALID_PLANS)[number],
  status: (typeof VALID_STATUSES)[number],
): Promise<void> {
  await postJson("/superadmin/set-plan", { ownerUserId, plan, status });
}
