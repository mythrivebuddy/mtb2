"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabaseClient";

export type AccountabilityFeedItem = {
  id: string;
  icon: "goal" | "update" | "result" | "comment" | "cycle";
  title: { message: string };
  time: string;
};

const fetchFeed = async (groupId: string): Promise<AccountabilityFeedItem[]> => {
  const res = await fetch(`/api/accountability/${groupId}/feed`);
  if (!res.ok) throw new Error("Failed to fetch feed");
  const data = await res.json();
  return data.items ?? [];
};

export default function useAccountabilityFeed(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(null);

  // ✅ Fetch initial feed using React Query
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["accountabilityFeed", groupId],
    queryFn: () => fetchFeed(groupId!),
    enabled: !!groupId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const channelName = useMemo(() => (groupId ? `acc-group-${groupId}` : undefined), [groupId]);

  useEffect(() => {
    if (!groupId || !channelName) return;

    const ch = supabaseClient.channel(channelName, { config: { broadcast: { self: true } } });
    channelRef.current = ch;

    // ✅ Listen for new feed items broadcasted in realtime
    ch.on("broadcast", { event: "feed" }, ({ payload }) => {
      const newItem = payload as AccountabilityFeedItem;

      // ✅ Immediately update cache without full refetch
      queryClient.setQueryData<AccountabilityFeedItem[]>(
        ["accountabilityFeed", groupId],
        (prev = []) => [newItem, ...prev].slice(0, 100)
      );
    });

    // ✅ Listen for "cycle_update" event to refetch full feed
    ch.on("broadcast", { event: "cycle_update" }, () => {
      queryClient.invalidateQueries({ queryKey: ["accountabilityFeed", groupId] });
    });

    ch.subscribe();

    return () => {
      if (channelRef.current) supabaseClient.removeChannel(channelRef.current);
    };
  }, [groupId, channelName, queryClient]);

  // ✅ Function to broadcast manually
  const broadcast = async (item: AccountabilityFeedItem) => {
    if (!channelRef.current) return;
    await channelRef.current.send({ type: "broadcast", event: "feed", payload: item });
  };

  // ✅ Function to notify others that a new cycle has started
  const broadcastCycleUpdate = async () => {
    if (!channelRef.current) return;
    await channelRef.current.send({ type: "broadcast", event: "cycle_update", payload: {} });
  };

  return { items, isLoading, refetch, broadcast, broadcastCycleUpdate };
}
