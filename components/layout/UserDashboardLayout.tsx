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

  // --- YEH FINAL FIX HAI ---
  // Hum sabhi private challenge pages ki ek list banayenge.
  // Isse hum exactly bata sakte hain ki kaun se pages par layout dikhana hai.
  const privateChallengeRoutes = [
    '/dashboard/challenge', // Main "Upcoming Challenges" page
    '/dashboard/challenge/upcoming-challenges', // Agar alag se page hai to
    '/dashboard/challenge/my-challenges',
    '/dashboard/challenge/create-challenge',
    '/dashboard/challenge/join-challenge',
    '/dashboard/challenge/let-others-roll'
  ];

  // Page public tabhi hai jab woh /dashboard/challenge/ se start ho,
  // lekin woh humari private list mein na ho.
  const isPublicChallengePage = 
    pathname.startsWith('/dashboard/challenge/') && 
    !privateChallengeRoutes.includes(pathname);

  // --- CONDITIONAL DATA FETCHING ---
  const { data: user, error } = useQuery<User>({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const response = await axios.get(`/api/user`);
      return response.data.user;
    },
    retry: false,
    enabled: !isPublicChallengePage, 
  });

  // --- HOOKS ---
  // Hooks ab hamesha call honge to avoid React errors.
  useUserPresence({ userId: user?.id } as UserPresenceProps);
  useOnlineUserLeaderBoard();
  
  // --- PUBLIC PAGE RENDER ---
  // Agar page public hai, to koi layout nahi.
  if (isPublicChallengePage) {
    return <>{children}</>;
  }
  
  // --- ERROR HANDLING FOR PRIVATE PAGES ---
  if (error) {
    console.error("Failed to fetch user data:", error);
    return <div>Error loading user data.</div>;
  }

  // --- PRIVATE DASHBOARD LAYOUT RENDER ---
  // Yeh layout ab "Upcoming Challenges" page par bhi sahi se dikhega.
  return (
    <div className="w-full min-h-screen bg-dashboard max-w-full overflow-hidden">
      <div className="fixed top-0 left-0 w-64 z-20 m-3">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 md:mt-5 md:mx-5 mt-20 !h-full">
        <div className="md:mx-10 mx-5">
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
