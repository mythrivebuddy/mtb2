"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Gift, Menu } from "lucide-react";
import { User as UserType } from "@/types/types";
import { SearchUser } from "@/types/client/nav";
import { ROUTE_TITLES } from "@/lib/constants/routeTitles";
import { cn } from "@/lib/utils/tw";

import { Badge, BadgeProps } from "@/components/ui/badge";
import { NotificationIcon } from "@/components/icons/NotificationIcons";
import MagicBoxModal from "@/components/modals/MagicBoxModal";
import UserProfileDropdown from "./UserProfileDropDown";

type TopBarProps = {
  user?: UserType;
  toggleSidebar: () => void;
};

// Helper component for consistent badge styling
const TopBarBadge = ({
  children,
  className,
  ...props
}: { children: React.ReactNode } & BadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-white rounded-md h-8 sm:h-10 flex items-center  justify-center px-1 sm:px-3 border border-[#4B65A2]",
        className,
      )}
      {...props}
    >
      {children}
    </Badge>
  );
};

// API function to fetch users based on search term
export const fetchUsers = async (searchTerm: string): Promise<SearchUser[]> => {
  const { data } = await axios.get(`/api/user/search?q=${searchTerm}`);
  return data.users;
};

// The main TopBar component
export default function TopBar({ user, toggleSidebar }: TopBarProps) {
  const pathname = usePathname();
  
  const [isMagicBoxOpen, setIsMagicBoxOpen] = useState(false);
  const [localProfilePicture, setLocalProfilePicture] = useState<string | null>(
    user?.image || null,
  );

  // Listen for profile updates from other components to update avatar in real-time
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail?.profilePicture) {
        setLocalProfilePicture(event.detail.profilePicture);
      }
    };
    window.addEventListener(
      "profileUpdated",
      handleProfileUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "profileUpdated",
        handleProfileUpdate as EventListener,
      );
    };
  }, []);


  // React Query hook for Magic Box status
  const { data: hasUnopenedBox } = useQuery({
    queryKey: ["magicBoxStatus"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/magic-box");
      return (
        data.magicBox && (!data.magicBox.isOpened || !data.magicBox.isRedeemed)
      );
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // React Query hook for unread notifications count
  const { data: unreadNotificationsCount } = useQuery<number>({
    queryKey: ["unreadNotificationsCount"],
    queryFn: async () => {
      const { data } = await axios.get<{ unreadCount: number }>(
        "/api/user/notifications/unread",
      );
      return data.unreadCount;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  // Determine the page title from the current route
  const currentRoute = pathname.split("/").pop()?.split("?")[0] || "dashboard";
  const pageTitle = ROUTE_TITLES[currentRoute] || "Dashboard";

  return (
    <header className="sticky top-0 z-50 px-2 sm:px-0 flex items-center justify-between lg:static">
      <button
        className="lg:hidden p-2 bg-white rounded-md shadow-md"
        onClick={toggleSidebar}
      >
        <Menu size={20} />
      </button>
      <h1 className="text-xl sm:text-2xl font-normal text-slate-800 lg:block hidden">
        {pageTitle}
      </h1>
      <div className="flex justify-between items-center gap-3 ml-auto">
        {/* <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-8 w-full items-start sm:items-center mb-5"> */}
        {/* <div className="flex flex-col sm:flex-row justify-between w-full sm:w-2/3 gap-4 sm:gap-0 items-center"> */}

        {/* Search Bar and Dropdown Container */}
        {/* <div className="relative hidden lg:flex w-full sm:w-80 md:w-94 lg:w-96">
            <div className="absolute inset-y-0 w-full left-0 flex items-center pl-3 pointer-events-none ">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="search"
              className="bg-white w-full shadow-md border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5"
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
              <div className="absolute  left-0 right-0 top-full z-10 mt-1 bg-white rounded-md shadow-lg border border-slate-200 max-h-60 overflow-auto">
                {isLoading ? (
                  <div className="p-2 text-sm text-slate-500">Loading...</div>
                ) : !users?.length ? ( // More robust check
                  <div className="p-2 text-sm text-slate-500">
                    No users found
                  </div>
                ) : (
                  users.map((user: SearchUser) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer"
                      target="_blank"
                      rel="noopener noreferrer" // Security fix
                      onMouseDown={(e) => e.preventDefault()} // Race condition fix
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          <p className="text-sm">{getInitials(user.name)}</p>
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div> */}

        {/* User Stats and Actions Section */}

        {/* <TopBarBadge>
            <Image
              src="/Pearls.png"
              alt="Icon"
              width={16}
              height={12}
              className="rounded-xl mr-1"
            />
            <span className="font-medium text-xs sm:text-base">GP</span>
            <span className="font-bold text-blue-500 ml-1 text-xs sm:text-base">
              {formatJP(user?.jpBalance || 0)}
            </span>
          </TopBarBadge> */}

        <Link href="/dashboard/notifications">
          <TopBarBadge className="cursor-pointer">
            <div className="relative">
              <NotificationIcon />
              {(unreadNotificationsCount ?? 0) > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  {unreadNotificationsCount}
                </div>
              )}
            </div>
          </TopBarBadge>
        </Link>

        <TopBarBadge
          className="cursor-pointer"
          onClick={() => setIsMagicBoxOpen(true)}
        >
          <div className="relative">
            <Gift size={20} />
            {hasUnopenedBox && (
              <div className="absolute top-[-2px] right-[-2px] w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
        </TopBarBadge>

        <UserProfileDropdown
          userName={user?.name}
          profilePicture={localProfilePicture}
        />
      </div>

      <MagicBoxModal
        isOpen={isMagicBoxOpen}
        onClose={() => setIsMagicBoxOpen(false)}
        userId={user?.id}
      />
    </header>
  );
}
