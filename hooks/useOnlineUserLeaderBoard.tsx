import { supabaseClient } from "@/lib/supabaseClient";
import { OnlineUser } from "@/types/client/user-info";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function useOnlineUserLeaderBoard() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const session = useSession();
  const userId = session?.data?.user?.id;
  console.log("User id ", userId);
  console.log("presecne of leadeborad called !!");

  useEffect(() => {
    if (!userId) {
      console.warn("No user id provided in leaderboard online");
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
      console.log("users in leaderboard online ", users);
    };

    presenceChannel
      .on("presence", { event: "join" }, updatePresence)
      .on("presence", { event: "leave" }, updatePresence)
      .on("presence", { event: "sync" }, updatePresence)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          presenceChannel.track({ observer: true }); // observer tracks self
          updatePresence();
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
        await presenceChannel.track({ observer:true});
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
  }, []);

  return onlineUsers;
}
