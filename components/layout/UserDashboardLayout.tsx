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

  // --- YEH FINAL, ROBUST LOGIC HAI ---
  // Hum sabhi private challenge pages ke "prefixes" (shuruaat ke hisse) ki list banayenge.
  const privateChallengePrefixes = [
    '/dashboard/challenge/my-challenges',
    '/dashboard/challenge/create-challenge',
    '/dashboard/challenge/join-challenge',
    '/dashboard/challenge/let-others-roll',
    '/dashboard/challenge/upcoming-challenges'
  ];

  // Check karo ki kya current path kisi private prefix se start hota hai.
  // .some() function list ke har item ke liye check karega.
  const isPrivateSubPage = privateChallengePrefixes.some(prefix => pathname.startsWith(prefix));
  
  // Also, check if it's the main challenge page itself, which is also private.
  const isMainChallengePage = pathname === '/dashboard/challenge';

  // Page public tabhi hai jab woh /dashboard/challenge/ se start ho,
  // lekin woh na to main page ho aur na hi koi private sub-page.
  const isPublicChallengePage = 
    pathname.startsWith('/dashboard/challenge/') && !isMainChallengePage && !isPrivateSubPage;

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
  // Yeh layout ab sabhi private pages (my-challenges ke andar waale bhi) par sahi se dikhega.
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
