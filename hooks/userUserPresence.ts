"use client";

import { supabaseClient } from "@/lib/supabaseClient";
import { useEffect } from "react";

export interface UserPresenceProps {
  userId: string;
}

export default function useUserPresence({ userId }: UserPresenceProps) {
  useEffect(() => {
    if (!userId) {
      console.warn("User id not provided");
      return;
    }

    const presenceChannel = supabaseClient.channel("user-presence", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "join" }, () => {
        console.log(`[Presence] ${userId} joined`);
      })
      .on("presence", { event: "leave" }, () => {
        console.log(`[Presence] ${userId} left`);
      })
      .on("presence", { event: "sync" }, () => {
        console.log(`[Presence] ${userId} sync event`);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Presence] Subscribed!");
          await presenceChannel.track({ userId });
        }
      });

    const cleanUpPresence = () => {
      presenceChannel.untrack();
    };

    const beforeUnloadHandler = () => {
      cleanUpPresence();
    };

    const visibilityHandler = async () => {
      if (document.visibilityState === "hidden") {
        cleanUpPresence();
      } else if (document.visibilityState === "visible") {
        await presenceChannel.track({ userId });
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      cleanUpPresence();
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
      supabaseClient.removeChannel(presenceChannel);
    };
  }, [userId]);
}
