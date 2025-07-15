import { supabaseClient } from "@/lib/supabaseClient";
import { OnlineUser } from "@/types/client/user-info";
import { useEffect, useState } from "react";

export default function useOnlineUserLeaderBoard() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const presenceChannel = supabaseClient.channel("user-presence", {
      config: {
        presence: {
          key: "observer", // passive, safe key
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
      .on("presence",{event:"sync"},updatePresence)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          presenceChannel.track({ observer: true }); // observer tracks self
          updatePresence();
        }
      });

    return () => {
      supabaseClient.removeChannel(presenceChannel);
    };
  }, []);

  return onlineUsers;
}
