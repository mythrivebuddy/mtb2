"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { usePathname } from 'next/navigation'; // Import usePathname

// Assuming these are your real components and types
import TopBar from "../dashboard/user/Topbar";
import Sidebar from "../dashboard/user/Sidebar";
import { User } from "@/types/types"; 
import useUserPresence, { UserPresenceProps } from "@/hooks/userUserPresence";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname(); // Get the current URL path

  // --- LOGIC TO IDENTIFY PUBLIC CHALLENGE PAGE ---
  // This checks if the current page is the dynamic, public-facing challenge page.
  const isPublicChallengePage = 
    pathname.startsWith('/dashboard/challenge/') && 
    !pathname.startsWith('/dashboard/challenge/create-challenge') &&
    !pathname.startsWith('/dashboard/challenge/join-challenge') &&
    !pathname.startsWith('/dashboard/challenge/let-others-roll') &&
    !pathname.startsWith('/dashboard/challenge/my-challenges');

  // --- CONDITIONAL DATA FETCHING ---
  // The 'enabled' option prevents this query from running on public pages,
  // which avoids the 500 error for guest users.
  const { data: user, error } = useQuery<User>({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const response = await axios.get(`/api/user`);
      return response.data.user;
    },
    retry: false,
    enabled: !isPublicChallengePage, // Only fetch user data if it's NOT a public page
  });

  // --- CONDITIONAL HOOKS ---
  // These hooks will only run if it's NOT a public page, because of the early return below.
  const userId = user?.id;
  useUserPresence({ userId } as UserPresenceProps);
  useOnlineUserLeaderBoard();

  // --- PUBLIC PAGE RENDER ---
  // If it's a public page, we render ONLY the page content without any layout.
  if (isPublicChallengePage) {
    return <>{children}</>;
  }
  
  // --- ERROR HANDLING FOR PRIVATE PAGES ---
  if (error) {
    console.error("Failed to fetch user data:", error);
    // You might want a more user-friendly error component here
    return <div>Error loading user data. Please try refreshing.</div>;
  }

  // --- PRIVATE DASHBOARD LAYOUT RENDER ---
  // This layout will only be rendered for private dashboard pages.
  return (
    <div className="w-full min-h-screen bg-dashboard max-w-full overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="fixed top-0 left-0 w-64 z-20 m-3">
        <Sidebar user={user} />
      </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 md:mt-5 md:mx-5 mt-20 !h-full">
        {/* Fixed TopBar */}
        <div className="md:mx-10 mx-5">
          <TopBar user={user} />
        </div>
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto md:pt-4 px-4 sm:px-6 lg:px-7 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
