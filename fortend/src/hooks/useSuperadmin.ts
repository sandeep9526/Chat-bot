"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllBots,
  fetchPlatformStats,
  suspendBot,
  setOwnerPlan,
  type VALID_PLANS,
  type VALID_STATUSES,
} from "@/lib/superadminApi";

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
