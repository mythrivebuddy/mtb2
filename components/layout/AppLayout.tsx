"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../navbars/navbar/Navbar";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();

  const { data: announcements } = useQuery({
    queryKey: ["user-announcement"],
    queryFn: async () => {
      const response = await axios.get("/api/user/announcement");
      return response.data.announcements;
    },
    enabled: status === "authenticated",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Rotate announcements every 10 seconds
  useEffect(() => {
    if (!announcements || announcements.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      setFade(false);

      // After fade-out, change the index and fade back in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        setFade(true);
      }, 500); // must match transition duration
    }, 10000);

    return () => clearInterval(interval);
  }, [announcements]);

  const currentAnnouncement =
    announcements && announcements.length > 0
      ? announcements[currentIndex]
      : null;

  return (
    <main className="min-h-screen py-4 sm:py-6 md:py-8 px-4">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-white rounded-[32px] p-4 sm:p-6 md:p-8">
          <Navbar />

          <div>
            {currentAnnouncement && (
              <div
                className={`relative mb-4 mt-2 h-[30px] sm:h-[40px] -mx-4 sm:-mx-6 md:-mx-8 shadow-md text-center flex justify-center items-center overflow-hidden transition-opacity duration-500 ease-in-out ${
                  fade ? "opacity-100" : "opacity-90"
                }`}
                style={{
                  backgroundColor:
                    currentAnnouncement.backgroundColor ?? "#f8f9fa",
                  color: currentAnnouncement.fontColor ?? "#000",
                }}
              >
                {/* Ribbon backward extension */}
                <div
                  className="absolute left-0 top-0 h-full w-[40px] -translate-x-full"
                  style={{
                    backgroundColor:
                      currentAnnouncement.backgroundColor ?? "#f8f9fa",
                  }}
                ></div>

                <a
                  href={currentAnnouncement.linkUrl ?? "#"}
                  target={currentAnnouncement.openInNewTab ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="inline-block py-2 text-xs sm:text-sm font-semibold animate-blinkContinuous"
                >
                  {currentAnnouncement.title}
                </a>
              </div>
            )}
          </div>

          {children}
        </div>
      </div>
    </main>
  );
};

export default AppLayout;
