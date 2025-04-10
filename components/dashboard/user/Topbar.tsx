"use client";

// components/TopBar.tsx
import { Search } from "lucide-react";
import { Badge, BadgeProps } from "@/components/ui/badge";
// import { Bell } from "lucide-react";
import React, { useState } from "react";
import { UserRound } from "lucide-react";
import { User as UserType } from "@/types/types";
import { usePathname } from "next/navigation";
import { ROUTE_TITLES } from "@/lib/constants/routeTitles";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/getInitials";
import Image from "next/image";
import { NotificationIcon } from "@/lib/icons/Icons";

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

interface SearchUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

const fetchUsers = async (searchTerm: string) => {
  const { data } = await axios.get(`/api/user/search?q=${searchTerm}`);
  return data.users;
};

export default function TopBar({ user }: { user?: UserType }) {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: () => fetchUsers(searchTerm),
    enabled: searchTerm.length > 0,
  });

  // Get the last segment of the pathname and remove query params
  const currentRoute = pathname.split("/").pop()?.split("?")[0] || "dashboard";
  const pageTitle = ROUTE_TITLES[currentRoute] || "Dashboard";

  return (
    <header className="h-16 bg-transparent flex items-center justify-between">
      {/* Page Title */}
      <div className="flex justify-between gap-8 w-full items-center">
        <div className="flex justify-between w-2/3">
          <h1 className="text-2xl font-normal text-slate-800">{pageTitle}</h1>

          {/* Search Bar */}
          <div className="relative max-w-md w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 focus:outline-none" />
            </div>
            <input
              type="search"
              className="bg-white shadow-md border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Search Anything Here..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && searchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200 max-h-60 overflow-auto">
                {isLoading ? (
                  <div className="p-2 text-sm text-slate-500">Loading...</div>
                ) : users?.length === 0 ? (
                  <div className="p-2 text-sm text-slate-500">
                    No users found
                  </div>
                ) : (
                  users?.map((user: SearchUser) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer"
                      onClick={() => {
                        setSearchTerm(user.name);
                        setShowDropdown(false);
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          <p className="text-sm">{getInitials(user.name)}</p>
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* JP Points Badge */}
          <TopBarBadge>
            <Image
              src="/Pearls.png"
              alt="Icon"
              width={20}
              height={15}
              className="rounded-xl mr-1"
            />
            <span className="font-medium">JP</span>
            <span className="font-bold text-blue-500 ml-1">
              {user?.jpBalance || 0}
            </span>
          </TopBarBadge>

          {/* Notifications */}
          <TopBarBadge>
            <NotificationIcon />
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </TopBarBadge>

          {/* User Avatar */}
          <div className="h-10 w-10 aspect-square cursor-pointer">
            <div className="rounded-md bg-white border border-[#4B65A2] flex items-center justify-center w-full h-full uppercase">
              {user?.name ? (
                <h2 className="text-2xl">{getInitials(user.name)}</h2>
              ) : (
                <UserRound />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
