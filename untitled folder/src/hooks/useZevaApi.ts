"use client";

/**
 * React Query hooks — these own SERVER state.
 *
 * Rule of thumb: Zustand = what the user is configuring/seeing;
 * React Query = what the server owns. Loading/error for the scan + typing come
 * from `useMutation().isPending` / `.error`, never from a Zustand boolean.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  sendChat,
  submitLead,
  fetchBotConfig,
  HAS_BACKEND,
  type BotPublicConfig,
} from "@/lib/api";
import type {
  ChatRequest,
  ChatResponse,
  LeadPayload,
  LeadResponse,
} from "@/lib/types";

/** Sending a chat message is a mutation (per-request, uncached). */
export function useSendMessage() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: sendChat,
  });
}

/** Submitting a captured lead is a mutation. */
export function useSubmitLead() {
  return useMutation<LeadResponse, Error, LeadPayload>({
    mutationFn: submitLead,
  });
}

/**
 * Fetch a bot's public config (real multi-tenant mode) — the widget brands
 * itself (name/accent/welcome/suggestions) from this at load. Config changes
 * rarely, so React Query caches it. Auto-disabled in mock/studio mode.
 */
export function useBotConfig(botId: string, options?: { enabled?: boolean }) {
  return useQuery<BotPublicConfig>({
    queryKey: ["botConfig", botId],
    enabled: options?.enabled ?? HAS_BACKEND,
    staleTime: 5 * 60_000, // config rarely changes → treat as fresh for 5 min
    queryFn: () => fetchBotConfig(botId),
  });
}
