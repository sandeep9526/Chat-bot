"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllBots,
  fetchPlatformStats,
  fetchAllUsers,
  fetchAllLeads,
  fetchAllChats,
  fetchAnalytics,
  checkPlatformAdmin,
  suspendBot,
  setOwnerPlan,
  deleteUser,
  type VALID_PLANS,
  type VALID_STATUSES,
} from "@/lib/superadminApi";

export function useCheckAdmin() {
  return useQuery({
    queryKey: ["superadmin", "check"],
    queryFn: checkPlatformAdmin,
    retry: false,
    staleTime: 60_000, // cache for 1 min — this rarely changes
  });
}

export function useAllBots() {
  return useQuery({
    queryKey: ["superadmin", "bots"],
    queryFn: fetchAllBots,
    retry: false, // a 403 won't fix itself on retry
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ["superadmin", "stats"],
    queryFn: fetchPlatformStats,
    retry: false,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ["superadmin", "users"],
    queryFn: fetchAllUsers,
    retry: false,
  });
}

export function useAllLeads() {
  return useQuery({
    queryKey: ["superadmin", "leads"],
    queryFn: fetchAllLeads,
    retry: false,
  });
}

export function usePlatformChats() {
  return useQuery({
    queryKey: ["superadmin", "chats"],
    queryFn: fetchAllChats,
    retry: false,
  });
}

export function usePlatformAnalytics() {
  return useQuery({
    queryKey: ["superadmin", "analytics"],
    queryFn: fetchAnalytics,
    retry: false,
    staleTime: 5 * 60_000, // analytics data: cache 5 min to avoid hammering DB
  });
}

export function useSuspendBot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ botId, suspended }: { botId: string; suspended: boolean }) =>
      suspendBot(botId, suspended),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin"] }),
  });
}

export function useSetOwnerPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ownerUserId,
      plan,
      status,
    }: {
      ownerUserId: string;
      plan: (typeof VALID_PLANS)[number];
      status: (typeof VALID_STATUSES)[number];
    }) => setOwnerPlan(ownerUserId, plan, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin"] }),
  });
}
