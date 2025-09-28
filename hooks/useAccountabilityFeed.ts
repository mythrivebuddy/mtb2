"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { supabaseClient } from "@/lib/supabaseClient";

export type AccountabilityFeedItem = {
  id: string;
  icon: "goal" | "update" | "result" | "comment" | "cycle";
  title: string;
  time: string; // humanized string for now
};

export default function useAccountabilityFeed(groupId: string | undefined) {
  const [items, setItems] = useState<AccountabilityFeedItem[]>([]);
  const channelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(null);

  const channelName = useMemo(() => (groupId ? `acc-group-${groupId}` : undefined), [groupId]);

  useEffect(() => {
    if (!groupId || !channelName) return;

    let isMounted = true;

    // Fetch initial feed from API
    fetch(`/api/accountability/${groupId}/feed`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && Array.isArray(data?.items)) setItems(data.items);
      })
      .catch(() => {});

    const ch = supabaseClient.channel(channelName, { config: { broadcast: { self: true } } });
    channelRef.current = ch;

    ch.on("broadcast", { event: "feed" }, ({ payload }) => {
      const next = payload as AccountabilityFeedItem;
      setItems((prev) => [next, ...prev].slice(0, 100));
    });

    ch.subscribe();

    return () => {
      isMounted = false;
      if (channelRef.current) supabaseClient.removeChannel(channelRef.current);
    };
  }, [groupId, channelName]);

  const broadcast = async (item: AccountabilityFeedItem) => {
    if (!channelRef.current) return;
    await channelRef.current.send({ type: "broadcast", event: "feed", payload: item });
  };

  return { items, broadcast };
}


