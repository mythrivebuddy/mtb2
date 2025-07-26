"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { usePathname } from 'next/navigation';

// Assuming these are your real components and types
import TopBar from "../dashboard/user/Topbar";
import Sidebar from "../dashboard/user/Sidebar";
import { User } from "@/types/types"; 
import useUserPresence, { UserPresenceProps } from "@/hooks/userUserPresence";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // This logic correctly identifies which pages are private vs. public
  const privateChallengePrefixes = [
    '/dashboard/challenge/my-challenges',
    '/dashboard/challenge/create-challenge',
    '/dashboard/challenge/join-challenge',
    '/dashboard/challenge/let-others-roll',
  ];
  const isPrivateSubPage = privateChallengePrefixes.some(prefix => pathname.startsWith(prefix));
  const isMainChallengePage = pathname === '/dashboard/challenge';
  
  const isPublicChallengePage = 
    pathname.startsWith('/dashboard/challenge/') && !isMainChallengePage && !isPrivateSubPage;

  // --- CONDITIONAL DATA FETCHING (Preserved) ---
  // This is the key: we only fetch user data for private pages.
  // For public pages, `enabled` is false, and the `user` object will be `undefined`.
  const { data: user, error } = useQuery<User>({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const response = await axios.get(`/api/user`);
      return response.data.user;
    },
    retry: false,
    enabled: !isPublicChallengePage, 
  });

  // --- HOOKS (Preserved) ---
  useUserPresence({ userId: user?.id } as UserPresenceProps);
  useOnlineUserLeaderBoard();
  
  // --- ERROR HANDLING (Preserved & Improved) ---
  // We only treat an error as critical on private pages.
  if (error && !isPublicChallengePage) {
    console.error("Failed to fetch user data:", error);
    return <div>Error loading user data. Please refresh the page.</div>;
  }

  // The layout will now render for ALL pages.
  // The `if (isPublicChallengePage)` block that hid the layout is the only thing that was removed.
  return (
    <div className="w-full min-h-screen bg-dashboard max-w-full overflow-hidden">
      <div className="fixed top-0 left-0 w-64 z-20 m-3">
        {/* Your Sidebar must be able to handle `user` being undefined for public visitors */}
        <Sidebar user={user} />
      </div>
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 md:mt-5 md:mx-5 mt-20 !h-full">
        <div className="md:mx-10 mx-5">
          {/* Your TopBar must also be able to handle a guest (undefined user) */}
          <TopBar user={user} />
        </div>
        <main className="flex-1 overflow-auto md:pt-4 px-4 sm:px-6 lg:px-7 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;