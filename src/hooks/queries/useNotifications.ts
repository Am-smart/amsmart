/**
 * Notifications query hook — polled refresh + invalidation helpers.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import * as actions from "@/lib/api-actions";
import type { Notification } from "@/lib/types";
import { queryKeys } from "./keys";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 min
const STALE = 60 * 1000;

export function useNotifications(userId: string | undefined, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notifications(userId ?? ""),
    enabled: !!userId && enabled,
    staleTime: STALE,
    gcTime: 10 * 60 * 1000,
    refetchInterval: enabled ? POLL_INTERVAL : false,
    refetchIntervalInBackground: false,
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return [];
      const data = await actions.getNotifications(userId);
      return (Array.isArray(data) ? data : []) as Notification[];
    },
  });

  const invalidate = useCallback(() => {
    if (!userId) return Promise.resolve();
    return queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
  }, [queryClient, userId]);

  return { ...query, invalidate };
}