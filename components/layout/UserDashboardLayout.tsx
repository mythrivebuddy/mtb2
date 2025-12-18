"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../dashboard/user/Topbar";
import Sidebar from "../dashboard/user/Sidebar";
import { User } from "@/types/types";
import useUserPresence from "@/hooks/userUserPresence";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import Footer from "../footer/Footer";
import { usePathname } from "next/navigation";

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { status: sessionStatus,data:session } = useSession();
  
  const pathname = usePathname();

  const { data: announcements } = useQuery({
    queryKey: ["user-announcement"],
    queryFn: async () => {
      const response = await axios.get("/api/user/announcement");
      return response.data.announcements;
    },
    enabled: sessionStatus === "authenticated",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!announcements || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [announcements]);

  const currentAnnouncement =
    announcements && announcements.length > 0
      ? announcements[currentIndex]
      : null;

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
  pathname.startsWith("/dashboard/challenge/");
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
    <div className={`w-full min-h-screen  ${shouldUseInheritBg ? 'bg-inherit':'bg-dashboard' } max-w-full overflow-hidden`}>
      {isLoggedIn  && (session.user.role === "USER") && (
        <div className="fixed top-0 left-0 w-64 z-20 m-3">
          <Sidebar user={user} />
        </div>
      )}

      <div
        className={`flex-1 flex flex-col !h-full transition-all duration-300 ${
          isLoggedIn ? "ml-0 lg:ml-64 md:mt-5 md:mx-5 mt-16" : ""
        }`}
      >
        {isLoggedIn && (session.user.role === "USER") && (
          <div className="md:mx-10 mx-5">
            <TopBar user={user} />
            {
              currentAnnouncement && (
                   <div className="px-3 sm:px-2 relative mb-4 mt-2 h-[40px] text-center overflow-hidden">
              <AnimatePresence mode="wait">
                {currentAnnouncement && (
                  <motion.div
                    key={currentAnnouncement._id || currentIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="h-[30px]  sm:h-[40px] min-h-fit flex items-center justify-center shadow-sm  rounded-sm"
                    style={{
                      backgroundColor:
                        currentAnnouncement.backgroundColor ?? "#f8f9fa",
                      color: currentAnnouncement.fontColor ?? "#000",
                    }}
                  >

                    <a
                      href={currentAnnouncement.linkUrl ?? "#"}
                      target={
                        currentAnnouncement.openInNewTab ? "_blank" : "_self"
                      }
                      rel="noopener noreferrer"
                      className="inline-block px-2 text-xs sm:text-sm font-semibold"
                    >
                      {currentAnnouncement.title}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
              )
            }
         
          </div>
        )}

        <main className="flex-1 overflow-auto lg:pt-4 px-4 bg-transparent">
          {children}
          <div className="px-4 sm:px-8"
          >
            {
              isLoggedIn && <Footer/>
            }
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
