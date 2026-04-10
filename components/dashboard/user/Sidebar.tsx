"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Sparkles,
  ShoppingCartIcon,
  Menu,
  WandSparklesIcon,
  LucideSignalHigh,
  TrendingUp,
  HomeIcon,
  LayoutDashboard,
  Droplet,
  Flower,
  Swords,
  Search,
  BellRing,
  Crown,
  GraduationCap,
  Award,
  BadgePercent,
} from "lucide-react";
import { cn } from "@/lib/utils/tw";
import { User as UserType } from "@/types/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/getInitials";
import { SearchUser } from "@/types/client/nav";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "./Topbar";
import { useSession } from "next-auth/react";

// Reusable navigation item component
type NavItemProps = {
  href?: string;
  icon: React.ReactNode;
  label: string;
  onLinkClick?: () => void; // Add prop for handling link click
};

const NavItem = ({ href, icon, label, onLinkClick }: NavItemProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = searchParams.get("tab");
  const view = searchParams.get("view");

  const isActive =
    href === "/dashboard/challenge?tab=join"
      ? pathname === "/dashboard/challenge" && tab === "join"
      : href === "/dashboard/challenge?tab=create"
        ? pathname === "/dashboard/challenge" && tab === "create"
        : href === "/dashboard/accountability/home?view=true"
          ? pathname === "/dashboard/accountability/home" && view === "true"
          : href === "/dashboard/accountability/home"
            ? pathname === "/dashboard/accountability/home" && !view // 👈 important
            : pathname === href;

  const content = (
    <>
      <div className="w-8">{icon}</div>
      <span className="font-normal text-[17px]">{label}</span>
    </>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className={cn(
            "flex items-center py-2 ",
            isActive ? "text-jp-orange" : "text-[#6C7894]",
          )}
          onClick={onLinkClick} // Call onLinkClick when link is clicked
        >
          {content}
        </Link>
      ) : (
        <div
          className={cn(
            "flex items-center py-2 cursor-pointer hover:text-jp-orange text-[#6C7894]",
          )}
        >
          {content}
        </div>
      )}
    </li>
  );
};

// Main navigation section component
type NavSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

const NavSection = ({ title, children, className }: NavSectionProps) => (
  <div className={cn("space-y-2", className)}>
    <h4 className="text-[#405D9F] font-normal text-sm">{title}</h4>
    <nav>
      <ul className="">{children}</ul>
    </nav>
  </div>
);

// Main sidebar component
const Sidebar = ({ user }: { user?: UserType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: () => fetchUsers(searchTerm),
    enabled: searchTerm.length > 0,
  });
  const pathname = usePathname();
  // const [isBuddyLensOpen, setIsBuddyLensOpen] = useState(false);
  const session = useSession();

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="px-1 md:px-2">
      {/* Hamburger Menu Button for Mobile */}
      <div className="flex items-center pt-1 px-4 gap-4 justify-between w-screen ">
        <button
          className="lg:hidden p-2 bg-white rounded-md shadow-md"
          onClick={toggleSidebar}
        >
          {isOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <Menu size={24} />
          )}
        </button>

        {/* 🛠️ WRAP THE SEARCH BAR IN A FLEX-GROW DIV */}
        <div className="relative w-full flex-1 lg:hidden">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>

          {/* Input */}
          <input
            type="search"
            className="w-[calc(100%-1.5rem)] bg-white shadow-md border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5"
            placeholder="Search Anything Here..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />

          {/* Dropdown */}
          {showDropdown && searchTerm && (
            <div className="absolute left-0 top-full mt-1 w-[calc(100%-1.5rem)] z-10 bg-white rounded-md shadow-lg border border-slate-200 max-h-60 overflow-auto">
              {isLoading ? (
                <div className="p-2 text-sm text-slate-500">Loading...</div>
              ) : users?.length === 0 ? (
                <div className="p-2 text-sm text-slate-500">No users found</div>
              ) : (
                users?.map((user: SearchUser) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer"
                    target="_blank"
                    onMouseDown={(e) => e.preventDefault()} // prevents blur closing
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div className="h-full self-stretch">
        <aside
          className={cn(
            "fixed lg:static top-0 left-0 h-[100vh]  bg-white shadow-lg rounded-3xl custom-scroll overflow-y-scroll transition-transform duration-300 z-50",
            "w-64 lg:w-64",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* User Profile Section */}
          <div className="flex flex-col my-6 px-5">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm">Hello</p>
                  <span className="text-amber-400">👋</span>
                </div>
                <h3 className="font-bold text-lg">
                  {user?.name ? user.name : "Your Name"}
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-5 mt-6">
              {/* Menu Section */}
              <NavSection title="Menu">
                <NavItem
                  href="/dashboard"
                  icon={<LayoutDashboard size={20} />}
                  label="Dashboard"
                  onLinkClick={toggleSidebar}
                />
                {/* <NavItem
                  href="/dashboard/leaderboard"
                  icon={<LayoutList size={20} />}
                  label="Leaderboard"
                  onLinkClick={toggleSidebar}
                /> */}
              </NavSection>
              <NavSection title="Features">
                <NavItem
                  href="/dashboard/aligned-actions"
                  icon={<TrendingUp size={20} />}
                  label="Set Today's Focus"
                  onLinkClick={toggleSidebar} // Pass toggleSidebar
                />
                <NavItem
                  href="/dashboard/daily-bloom"
                  icon={<Flower size={20} />}
                  label="Plan The Day"
                  onLinkClick={toggleSidebar}
                />
                <NavItem
                  href="/dashboard/reminders"
                  icon={<BellRing />}
                  label="Set Reminders"
                  onLinkClick={toggleSidebar} // Pass toggleSidebar
                />
                <NavItem
                  href="/dashboard/progress-vault"
                  icon={<LucideSignalHigh size={20} />}
                  label="Log Wins"
                  onLinkClick={toggleSidebar} // Pass toggleSidebar
                />
                <NavItem
                  href="/dashboard/miracle-log"
                  icon={<WandSparklesIcon size={20} />}
                  label="Log Miracles"
                  onLinkClick={toggleSidebar}
                />
                <NavItem
                  href="/dashboard/challenge?tab=join"
                  icon={<Swords size={20} />}
                  label="Join Challenges"
                  onLinkClick={toggleSidebar}
                />
                <NavItem
                  href="/dashboard/mini-mastery-programs"
                  icon={<GraduationCap size={20} />}
                  label="Join Mini Mastery Programs"
                  onLinkClick={toggleSidebar}
                />
                <div className="flex items-center ">
                  <Link href="/MTB-2026-the-complete-makeover-program">
                    <span className="flex items-center gap-3 py-2 cursor-pointer  text-[#6C7894]">
                      <Crown size={20} className="w-7" />
                      2026 Complete Makeover Program
                    </span>
                  </Link>
                </div>
                <NavItem
                  href="/dashboard/store"
                  icon={<ShoppingCartIcon size={20} />}
                  label="Growth Store"
                  onLinkClick={toggleSidebar} // Pass toggleSidebar
                />
                <NavItem
                  href="/dashboard/accountability/home?view=true"
                  icon={<LayoutDashboard size={20} />}
                  label="View Groups"
                  onLinkClick={toggleSidebar} // Pass toggleSidebar
                />
              </NavSection>
              {/* Settings Section */}
              {(session.data?.user.userType == "COACH" ||
                session.data?.user.userType == "SOLOPRENEUR") && (
                <NavSection title="For Coach/Solopreneur">
                  <NavItem
                    href="/dashboard/business-profile"
                    icon={<User size={20} />}
                    label="Setup Business Profile"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />
                  <NavItem
                    href="/dashboard/spotlight"
                    icon={<Sparkles size={20} />}
                    label="Get a Spotlight"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />
                  <NavItem
                    href="/dashboard/challenge?tab=create"
                    icon={<Swords size={20} />}
                    label="Create a Challenge"
                    onLinkClick={toggleSidebar}
                  />

                  <div className="flex items-center ">
                    <Link
                      href="/dashboard/mini-mastery-programs/create"
                      onClick={toggleSidebar}
                      className={`flex items-center  py-2 text-[#6C7894] ${pathname === "/dashboard/mini-mastery-programs/create" ? "text-jp-orange" : ""}`}
                    >
                      <GraduationCap size={20} className="w-7" />

                      {/* Extra gap added here */}
                      <span className="font-normal text-[17px] ml-3">
                        Create Mini Mastery Programs
                      </span>
                    </Link>
                  </div>
                  <NavItem
                    href="/dashboard/manage-store"
                    icon={<ShoppingCartIcon size={20} />}
                    label="Manage Your Store"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />
                  
                  
                  <NavItem
                    href="/dashboard/accountability/home"
                    icon={<LayoutDashboard size={20} />}
                    label="Create Accountability Group"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />
                  <NavItem
                    href="/dashboard/buddy-lens"
                    icon={<HomeIcon size={20} />}
                    label="Get a Profile Audit"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />
                  <NavItem
                    href="/dashboard/prosperity"
                    icon={<Droplet size={20} />}
                    label="Apply for a Grant"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />
                  <NavItem
                    href="/dashboard/coupons"
                    icon={<BadgePercent size={20} />}
                    label="Manage Coupons"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />
                  <NavItem
                    href="/dashboard/manage-certificates"
                    icon={<Award size={20} />}
                    label="Manage Certificates"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />
                  {/* <ComingSoonWrapper>
                      <NavItem
                        icon={<PhoneCall size={20} />}
                        label="Promote Discovery Calls"
                        onLinkClick={toggleSidebar}
                      />
                    </ComingSoonWrapper>

                    <ComingSoonWrapper>
                      <NavItem
                        icon={<Video size={20} />}
                        label="Promote Webinars"
                        onLinkClick={toggleSidebar}
                      />
                    </ComingSoonWrapper> */}

                  {/* <ComingSoonWrapper>
                    <NavItem
                      icon={<GraduationCap size={20} />}
                      label="Promote Mini Mastery Programs"
                      onLinkClick={toggleSidebar}
                    />
                  </ComingSoonWrapper> */}
                </NavSection>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Sidebar;
