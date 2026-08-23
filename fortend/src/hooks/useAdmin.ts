"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBots,
  fetchStats,
  fetchLeads,
  fetchHandoffs,
  fetchSubscription,
  ingestDoc,
  uploadKnowledgeFile,
  createBot,
  deleteLead,
  deleteBot,
  setBotPaused,
  fetchDocs,
  deleteDocFile,
  createStripeCheckoutSession,
  createRazorpaySubscription,
  fetchPlaygroundSessions,
  upsertPlaygroundSession,
  deletePlaygroundSession,
  type CreateBotPayload,
  type BillingPlan,
} from "@/lib/adminApi";

export function useBots() {
  return useQuery({ queryKey: ["admin", "bots"], queryFn: fetchBots });
}

export function useStats(botId: string) {
  return useQuery({
    queryKey: ["admin", "stats", botId],
    queryFn: () => fetchStats(botId),
    enabled: Boolean(botId),
  });
}

export function useLeads(botId: string) {
  return useQuery({
    queryKey: ["admin", "leads", botId],
    queryFn: () => fetchLeads(botId),
    enabled: Boolean(botId),
  });
}

export function useHandoffs(botId: string) {
  return useQuery({
    queryKey: ["admin", "handoffs", botId],
    queryFn: () => fetchHandoffs(botId),
    enabled: Boolean(botId),
  });
}

export function useIngestDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { botId: string; filename: string; text: string }) =>
      ingestDoc(v.botId, v.filename, v.text),
    // Docs badle → stats refresh (chats/leads waise hi rehte hain).
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

/** Upload a knowledge file (PDF / Word / text / Markdown / image) → extract + index. */
export function useIngestFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { botId: string; file: File }) =>
      uploadKnowledgeFile(v.botId, v.file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

/** Reserve/upsert a bot (used by the create/edit modal). */
export function useCreateBot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBotPayload) => createBot(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bots"] }),
  });
}

/** Permanently delete a bot the caller owns. */
export function useDeleteBot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (botId: string) => deleteBot(botId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

/** Pause/resume a bot the caller owns. */
export function useSetBotPaused() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { botId: string; paused: boolean }) =>
      setBotPaused(v.botId, v.paused),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bots"] }),
  });
}

export function useSubscription() {
  return useQuery({ queryKey: ["admin", "subscription"], queryFn: fetchSubscription });
}

/** Global (non-India) upgrade — resolves to the Stripe Checkout URL to redirect to. */
export function useCreateStripeCheckout() {
  return useMutation({
    mutationFn: (v: { plan: BillingPlan; successUrl: string; cancelUrl: string }) =>
      createStripeCheckoutSession(v.plan, v.successUrl, v.cancelUrl),
  });
}

/** India upgrade — resolves to the Razorpay subscription to open Checkout.js against. */
export function useCreateRazorpaySubscription() {
  return useMutation({
    mutationFn: (plan: BillingPlan) => createRazorpaySubscription(plan),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: number) => deleteLead(leadId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useDocs(botId: string) {
  return useQuery({
    queryKey: ["admin", "docs", botId],
    queryFn: () => fetchDocs(botId),
    enabled: Boolean(botId),
  });
}

export function useDeleteDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { botId: string; filename: string }) =>
      deleteDocFile(v.botId, v.filename),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function usePlaygroundSessions(botId: string) {
  return useQuery({
    queryKey: ["admin", "playground-sessions", botId],
    queryFn: () => fetchPlaygroundSessions(botId),
    enabled: Boolean(botId),
  });
}

export function useUpsertPlaygroundSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { botId: string; id: string; title: string; messages: any[] }) =>
      upsertPlaygroundSession(v.botId, v.id, v.title, v.messages),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["admin", "playground-sessions", v.botId] });
    },
  });
}

export function useDeletePlaygroundSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { botId: string; sessionId: string }) =>
      deletePlaygroundSession(v.botId, v.sessionId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["admin", "playground-sessions", v.botId] });
    },
  });
}
