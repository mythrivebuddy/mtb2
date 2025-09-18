// hooks/useUserPresence.ts

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { useSupabase } from "@/components/providers/SupabaseClientProvider";

// This hook no longer needs any props. It will get the user from the session.
export default function useUserPresence() {
   const supabase = useSupabase();
  const { data: nextAuthSession } = useSession();

  useEffect(() => {
    // 2. Get user ID from the NextAuth session
    const userId = (nextAuthSession?.user as any)?.id;

    // 3. If either the client isn't ready or we have no user, stop.
    if (!supabase || !userId) {
      console.warn("[Presence] Supabase client or User ID not ready.");
      return;
    }

  

    // 6. All of your original logic will now work with the authenticated client
    const presenceChannel: RealtimeChannel = supabase.channel("user-presence", {
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
      supabase.removeChannel(presenceChannel);
      // DO NOT call .auth.signOut() here. Just remove the channel.
    };
  }, [ supabase, nextAuthSession]); // Re-run if any of these change

}