"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react"; // 1. Import useSession
import { Loader2 } from "lucide-react";
import TopBar from "../dashboard/user/Topbar";
import Sidebar from "../dashboard/user/Sidebar";
import { User } from "@/types/types";
import useUserPresence, { UserPresenceProps } from "@/hooks/userUserPresence";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  // Use the session hook as the primary source for auth status
  const { status: sessionStatus } = useSession();
  
   const { data: announcements } = useQuery({
    queryKey: ["user-announcement"],
    queryFn: async () => {
      const response = await axios.get("/api/user/announcement");
      return response.data.announcements;
    },
    enabled: sessionStatus === "authenticated", // only run if logged in
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate announcements every 10 seconds
  useEffect(() => {
    if (!announcements || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 10000); // 10s

    return () => clearInterval(interval);
  }, [announcements]);

  const currentAnnouncement =
    announcements && announcements.length > 0
      ? announcements[currentIndex]
      : null;
  // Fetch detailed user info only when the user is authenticated
  const { data: user } = useQuery<User>({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const response = await axios.get(`/api/user`);
      return response.data.user;
    },
    retry: false,
    // Only run this query if the session is authenticated
    enabled: sessionStatus === "authenticated",
  });

  // --- HOOKS ---
  useUserPresence({ userId: user?.id } as UserPresenceProps);
  useOnlineUserLeaderBoard();

  // --- RELIABLE LOADING STATE ---
  // Show a loader while NextAuth is verifying the session. This prevents the UI flicker.
  if (sessionStatus === "loading") {
    return (
      <div className="w-full min-h-screen bg-dashboard flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // The user is considered logged in if the session is authenticated.
  const isLoggedIn = sessionStatus === "authenticated" && !!user;
// session to check logged in or 
  return (
    <div className="w-full min-h-screen bg-dashboard max-w-full overflow-hidden">
      {/* Conditionally render the Sidebar for logged-in users */}
      {isLoggedIn && (
        <div className="fixed top-0 left-0 w-64 z-20 m-3">
          <Sidebar user={user} />
        </div>
      )}

      {/* The main content wrapper's classes are now conditional */}
      <div
        className={`flex-1 flex flex-col !h-full transition-all duration-300 ${
          isLoggedIn ? "ml-0 lg:ml-64 md:mt-5 md:mx-5 mt-16" : ""
        }`}
      >
        {/* Conditionally render the TopBar for logged-in users */}
        {isLoggedIn && (
          <div className="md:mx-10 mx-5">
            <TopBar user={user} />
            <div className="px-4 sm:px-2">

             {currentAnnouncement && (
               <div
              className="mb-4 px-6 h-[30px] sm:h-[40px] flex justify-center items-center rounded-sm shadow-md text-center"
              style={{
                backgroundColor:
                currentAnnouncement.backgroundColor ?? "#f8f9fa",
                color: currentAnnouncement.fontColor ?? "#000",
              }}
              >
              <a
                href={currentAnnouncement.linkUrl ?? "#"}
                target={currentAnnouncement.openInNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="inline-block text-xs sm:text-sm font-semibold animate-blinkContinuous"
              >
                {currentAnnouncement.title}
              </a>
            </div>
          )}
          </div>
          </div>
        )}
         
        <main className="flex-1 overflow-auto lg:pt-4 px-4 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
