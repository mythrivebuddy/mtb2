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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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
    pathname.startsWith("/dashboard/challenge/") ||
    pathname === "/dashboard/store" ||
    pathname.startsWith("/dashboard/store/") ||
    pathname === "/dashboard/mini-mastery-programs";
  const shouldUseInheritBg = isChallengeRoute && isGuest && !isLoading;

  if (sessionStatus === "loading") {
    return (
      <div className="w-full min-h-screen bg-dashboard flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  const isLoggedIn = sessionStatus === "authenticated" && !!user;

  return (
    <div
      className={`w-full min-h-screen  ${shouldUseInheritBg ? "bg-inherit" : "bg-dashboard"} max-w-full`}
    >
      {isLoggedIn && session.user.role === "USER" && (
        <div className="fixed top-0 left-0 w-64 z-20 m-3">
          <Sidebar
            user={user}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />
        </div>
      )}

      {isLoggedIn && session.user.role === "USER" && (
        <div className="lg:hidden px-6 py-4 mb-8 fixed top-0 left-0 right-0 z-10">
          <TopBar user={user} toggleSidebar={() => setIsSidebarOpen(true)} />
        </div>
      )}
      <div
  className={`flex-1 flex flex-col min-h-screen transition-all duration-300
  ${isLoggedIn ? "ml-0 lg:ml-64 pt-20 lg:pt-6" : ""}`}
>
        {isLoggedIn && session.user.role === "USER" && (
          <div className="md:mx-8 mx-5 hidden lg:block">
            <TopBar user={user} toggleSidebar={() => setIsSidebarOpen(true)} />
          </div>
        )}

        <main className="flex-1 lg:pt-4 py-6 px-4 bg-transparent">
          {children}
          <div className="px-4 sm:px-8">{isLoggedIn && <Footer />}</div>
        </main>
      </div>
      <FirstVisitNotificationPopup />
      <UserTypeSelection authMethod={session?.user.authMethod} />
    </div>
  );
};

export default UserDashboardLayout;
