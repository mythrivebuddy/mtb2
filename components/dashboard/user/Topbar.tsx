"use client";

// components/TopBar.tsx
import { Search } from "lucide-react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import React from "react";
import { UserRound } from "lucide-react";
import { User as UserType } from "@/types/types";
import { usePathname } from "next/navigation";
import { ROUTE_TITLES } from "@/lib/constants/routeTitles";

const TopBarBadge = ({
  children,
  ...props
}: { children: React.ReactNode } & BadgeProps) => {
  return (
    <Badge
      variant="outline"
      className="bg-white rounded-md h-10 flex items-center justify-center px-3 border border-[#4B65A2]"
      {...props}
    >
      {children}
    </Badge>
  );
};

export default function TopBar({ user }: { user?: UserType }) {
  const pathname = usePathname();

  // Get the last segment of the pathname and remove query params
  const currentRoute = pathname.split("/").pop()?.split("?")[0] || "dashboard";
  const pageTitle = ROUTE_TITLES[currentRoute] || "Dashboard";

  return (
    <header className="h-16 bg-transparent flex items-center justify-between">
      {/* Page Title */}
      <div className="flex justify-between gap-8 w-full items-center">
        <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>

        {/* Search Bar */}
        <div className="relative max-w-md w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 focus:outline-none" />
          </div>
          <input
            type="search"
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Search Anything Here..."
          />
        </div>

        <div className="flex gap-6">
          {/* JP Points Badge */}
          <TopBarBadge>
            <span className="mr-1">🏆</span>
            <span className="font-medium">JP</span>
            <span className="font-bold text-blue-500 ml-1">{user?.jpBalance || 0}</span>
          </TopBarBadge>

          {/* Notifications */}
          <TopBarBadge>
            <Bell className="h-5 w-5" />
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </TopBarBadge>

          {/* User Avatar */}
          <div className="h-10 w-10 aspect-square cursor-pointer">
            {/* <AvatarImage src="./avtar.png" alt="User" /> */}
            <div className=" rounded-md bg-white border border-[#4B65A2] flex items-center justify-center w-full h-full">
              {user?.name ? (
                <h2 className="text-2xl ">{user.name.slice(0, 2)}</h2>
              ) : (
                <UserRound />
              )}
            </div>
            {/* <AvatarFallback className="rounded-md bg-white border border-[#4B65A2]">
              <UserRound />
            </AvatarFallback> */}
          </div>
        </div>
      </div>
    </header>
  );
}
