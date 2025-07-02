"use client";

import { supabaseClient } from "@/lib/supabaseClient";
import axios from "axios";

import { set } from "date-fns";
import { useEffect } from "react";

export interface UserPresenceProps {
    userId: string;
}

// export default function useUserPresence({userId}: UserPresenceProps) {
//     useEffect(()=>{
//         if (!userId) {
//             return
//         }
//         console.log("user id in useUserPresence hook", userId);
        
//        const markOnline = async()=>{
//         await axios.post(`/api/mark-online-offline`,{
//             userId,
//             online: true
//         });
//         console.log("User marked as online");
//        }
//        markOnline();
//        const markOffline = async()=>{
//         await axios.post(`/api/mark-online-offline`,{
//             userId,
//             online: false
//         });
//        }
//        window.addEventListener("beforeunload",markOffline);
//        return()=>{
//         markOffline();
//         window.removeEventListener("beforeunload",markOffline);
//        }

//     },[userId]);

//     return null; // This hook doesn't return anything, it just toggle user's online/offline status
// }

// hooks/useUserPresence.ts

export default function useUserPresence({ userId }: UserPresenceProps) {
  useEffect(() => {
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
        }
      });

    const beforeUnloadHandler = () => {
      markOnlineStatus(false);
      presenceChannel.unsubscribe();
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      markOnlineStatus(false);
      presenceChannel.unsubscribe();
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  }, [userId]);
}
