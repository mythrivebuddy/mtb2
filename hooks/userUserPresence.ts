"use client";

import { supabaseClient } from "@/lib/supabaseClient";
import axios from "axios";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OnlineUser } from "@/types/client/user-info";
export interface UserPresenceProps {
    userId: string;
}



export default function useUserPresence({ userId }: UserPresenceProps) {
  const [onlineUsersLeaderboard,setOnlineUsersLeaderboard] = useState<OnlineUser[]>([]);
  useEffect(() => {
    console.log("user id in useUserPresence hook", userId);
    if (!userId) {
      console.warn("No userId provided for presence tracking.");
      return;
    }
    const presenceChannel = supabaseClient.channel("user-presence", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    const markOnlineStatus = async (online: boolean) => {
      try {
        await axios.post("/api/mark-online-offline", {
          userId,
          online,
        });
      } catch (err) {
        console.error("Failed to update online status:", err);
      }
    };

    presenceChannel
      .on("presence", { event: "join" }, () => markOnlineStatus(true))
      .on("presence", { event: "leave" }, () => markOnlineStatus(false))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Presence] Subscribed!");
          await presenceChannel.track({ userId });
          await markOnlineStatus(true);
          const presence = presenceChannel.presenceState();
          const users = Object.keys(presence).map((id) => ({ userId: id }));
          setOnlineUsersLeaderboard(users);
    
        }
      });

   
      const cleanUpPresence = () => {
      presenceChannel.untrack();
      markOnlineStatus(false);
    // supabaseClient.removeChannel(presenceChannel);
  };

  const beforeUnloadHandler = () => {
    cleanUpPresence();
  };

  const visibilityHandler = async() => {
    if (document.visibilityState === "hidden") {
      cleanUpPresence();
    } else if (document.visibilityState==="visible") {
      await presenceChannel.track({userId})
      await markOnlineStatus(true);
      
    }
  };

  window.addEventListener("beforeunload", beforeUnloadHandler);
  document.addEventListener("visibilitychange", visibilityHandler);

  return () => {
    cleanUpPresence();
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    supabaseClient.removeChannel(presenceChannel);
    document.removeEventListener("visibilitychange", visibilityHandler);
  };
  }, [userId]);
  return onlineUsersLeaderboard;

}





