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
  type CreateBotPayload,
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

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: number) => deleteLead(leadId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}
