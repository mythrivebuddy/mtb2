"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import TopBar from "../dashboard/user/Topbar";
import Sidebar from "../dashboard/user/Sidebar";
import { User } from "@/types/types";
import useUserPresence from "@/hooks/userUserPresence";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import Footer from "../footer/Footer";
import { usePathname } from "next/navigation";
import FirstVisitNotificationPopup from "../dashboard/user/FirstNotificationPopUp";
import UserTypeSelection from "../dashboard/user/UserTypeSelection";

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { status: sessionStatus, data: session } = useSession();

  const pathname = usePathname();


  const { data: user } = useQuery<User>({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const response = await axios.get(`/api/user`);
      return response.data.user;
    },
    retry: false,
    enabled: sessionStatus === "authenticated",
  });

  useUserPresence();
  useOnlineUserLeaderBoard();
  const isLoading = sessionStatus == "loading";
  const isGuest = sessionStatus === "unauthenticated";
  const isChallengeRoute =
    pathname === "/dashboard/challenge" ||
    pathname.startsWith("/dashboard/challenge/") || pathname === "/dashboard/store" || pathname.startsWith("/dashboard/store/") || pathname === "/dashboard/mini-mastery-programs";
  const shouldUseInheritBg =
    isChallengeRoute &&
    isGuest &&
    !isLoading;

  if (sessionStatus === "loading") {
    return (
      <div className="w-full min-h-screen bg-dashboard flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  const isLoggedIn = sessionStatus === "authenticated" && !!user;

  return (
    <div className={`w-full min-h-screen  ${shouldUseInheritBg ? 'bg-inherit' : 'bg-dashboard'} max-w-full overflow-hidden`}>
      {isLoggedIn && (session.user.role === "USER") && (
        <div className="fixed top-0 left-0 w-64 z-20 m-3">
          <Sidebar user={user} />
        </div>
      )}

      <div
        className={`flex-1 flex flex-col h-full transition-all duration-300 ${isLoggedIn ? "ml-0 lg:ml-64 md:mt-5 md:mx-5 mt-16" : ""
          }`}
      >
        {isLoggedIn && (session.user.role === "USER") && (
          <div className="md:mx-10 mx-5">
            <TopBar user={user} />
          </div>
        )}

        <main className="flex-1 overflow-auto lg:pt-4 px-4 bg-transparent">
          {children}
          <div className="px-4 sm:px-8"
          >
            {
              isLoggedIn && <Footer />
            }
          </div>
        </main>
      </div>
      <FirstVisitNotificationPopup />
      <UserTypeSelection authMethod={session?.user.authMethod} />
    </div>
  );
};

export default UserDashboardLayout;
