import { supabaseClient } from "@/lib/supabaseClient";
import { OnlineUser } from "@/types/client/user-info";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function useOnlineUserLeaderBoard() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { data: session, status } = useSession(); // Get session data and status
  const userId = session?.user?.id;

  // The main logic is now inside useEffect, which only runs on the client.
  useEffect(() => {
    // This check is now more robust. It waits for an authenticated session.
    if (status !== 'authenticated' || !userId) {
      return;
    }

    const presenceChannel = supabaseClient.channel("user-presence", {
      config: {
        presence: {
          key: userId, 
        },
      },
    });

    const updatePresence = () => {
      const presence = presenceChannel.presenceState();
      const users = Object.keys(presence).map((id) => ({ userId: id }));
      setOnlineUsers(users);
    };

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

    const cleanUpPresence = async () => {
      await presenceChannel.untrack();
    };

    const beforeUnloadHandler = () => {
      cleanUpPresence();
    };

    const visibilityHandler = async () => {
      if (document.visibilityState === "hidden") {
        await cleanUpPresence();
      } else if (document.visibilityState === "visible") {
        await presenceChannel.track({ observer: true });
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    document.addEventListener("visibilitychange", visibilityHandler);

    // Cleanup function
    return () => {
      cleanUpPresence();
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
      supabaseClient.removeChannel(presenceChannel);
    };
  }, [userId, status]); // ✅ FIXED: Added userId and status to the dependency array.

  return onlineUsers;
}
