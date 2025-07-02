"use client";

import { useEffect } from "react";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabaseClient";
import { IUser } from "@/types/client/user-info";

// export default function useUsersRealtime() {
//   const queryClient = useQueryClient();

//   // useEffect(() => {
//   //   console.log("Setting up realtime subscription for user status updates");

//   //   const channel = supabaseClient.channel("users-presence");

//   //   const subscription = channel
//   //     .on(
//   //       "postgres_changes",
//   //       {
//   //         event: "UPDATE",
//   //         schema: "public",
//   //         table: "users",
//   //         filter: "isOnline=eq.true",
//   //       },
//   //       (payload) => {
//   //         console.log("Received user status update:", payload);
//   //         const updatedUser = payload.new as IUser;
//   //         console.log("User status updated:", updatedUser);

//   //         queryClient.invalidateQueries({
//   //           queryKey: ["users"],
//   //           exact: false,
//   //         });
//   //       }
//   //     )
//   //     .subscribe((status) => {
//   //       if (status === "SUBSCRIBED") {
//   //         console.log("✅ Realtime subscription successful");
//   //       }
//   //     });

//   //   // Cleanup function: remove the channel on unmount
//   //   return () => {
//   //     supabaseClient.removeChannel(channel);
//   //   };
//   // }, [queryClient, supabaseClient]);

//   // return null; // No UI component, just side effects
// }
export default function useUsersRealtime(queryKey:QueryKey) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabaseClient
      .channel("users-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
        },
        (payload) => {
          if ("isOnline" in payload.new) {
            console.log(
              `User ${payload.new.id} online status changed: ${payload.new.isOnline}`
              .subscribe();
            );
             queryClient.invalidateQueries({ queryKey });
          }
        }
      )
      // window.location.reload();
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [queryClient,queryKey]);
}