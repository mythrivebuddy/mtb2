"use client";
import React from "react";
import TopBar from "../dashboard/user/Topbar";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { User } from "@/types/types";
import Sidebar from "../dashboard/user/Sidebar";
import { Loader2 } from "lucide-react";
import PageLoader from "../PageLoader";

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const response = await axios.get("/api/user");
      return response.data.user;
    },
    retry: false,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    console.error("Failed to fetch user data:", error);
    return <div>Error loading user data</div>;
  }

  return (
    <div className="flex h-full p-7 overflow-auto w-full bg-dashboard">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden pl-7">
        <TopBar user={user} />
        <main className="flex-1 overflow-auto bg-transparent">{children}</main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
