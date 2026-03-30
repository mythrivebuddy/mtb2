"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function useAnnouncements() {
  const { data: session } = useSession();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["user-announcement"],
    queryFn: async () => {
      const response = await axios.get("/api/user/announcement");
      return response.data.announcements;
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
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

  return {
    announcements,
    currentAnnouncement,
    isLoading,
    currentIndex,
  };
}
