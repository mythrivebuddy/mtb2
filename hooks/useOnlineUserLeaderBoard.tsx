"use client"; // ensure this is a client component hook

import { supabaseClient } from "@/lib/supabaseClient";

import { OnlineUser } from "@/types/client/user-info";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function useOnlineUserLeaderBoard() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    // Client-only + valid session + Supabase channel check
    if (typeof window === "undefined") return;
    if (!userId || status !== "authenticated") return;
    if (!supabaseClient?.channel) return;

    // Create presence channel
    const presenceChannel = supabaseClient.channel("user-presence", {
      config: { presence: { key: userId } },
    });

    // Function to update online users state
    const updatePresence = () => {
      const presence = presenceChannel.presenceState();
      const users = Object.keys(presence).map((id) => ({ userId: id }));
      setOnlineUsers(users);
    };

    // Subscribe to presence events
    presenceChannel
      .on("presence", { event: "join" }, updatePresence)
      .on("presence", { event: "leave" }, updatePresence)
      .on("presence", { event: "sync" }, updatePresence)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ observer: true });
          updatePresence();
        }
      });

    // Cleanup functions
    const cleanUpPresence = async () => {
      await presenceChannel.untrack();
    };

    const handleBeforeUnload = () => {
      cleanUpPresence();
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        await cleanUpPresence();
      } else if (document.visibilityState === "visible") {
        await presenceChannel.track({ observer: true });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cleanUpPresence();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabaseClient.removeChannel(presenceChannel);
    };
  }, [userId, status]);

  return onlineUsers;
}
