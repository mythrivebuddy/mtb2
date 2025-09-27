'use client';
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
export default function AnnouncementBanner(){
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

  // Rotate announcements every 10 seconds
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
        if (!currentAnnouncement) return null;
    return(
        <div className={` relative mb-4 mt-2 h-[40px] -mx-4 sm:-mx-6 md:-mx-8 text-center overflow-hidden`}>
           <AnimatePresence mode="wait">
              {currentAnnouncement && (
                <motion.div
                  key={currentAnnouncement._id || currentIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className={ `h-[30px] min-h-fit  sm:h-[40px] flex items-center justify-center shadow-md relative`}
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