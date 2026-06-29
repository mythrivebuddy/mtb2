"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import Link from "next/link";
import {
  User,
  Sparkles,
  ShoppingCartIcon,
  WandSparklesIcon,
  LucideSignalHigh,
  TrendingUp,
  HomeIcon,
  LayoutDashboard,
  Droplet,
  Flower,
  Swords,
  BellRing,
  Crown,
  GraduationCap,
  Award,
  BadgePercent,
  Compass,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils/tw";
import { User as UserType } from "@/types/types";
import { useSession } from "next-auth/react";


// Reusable navigation item component
type NavItemProps = {
  href?: string;
  icon: React.ReactNode;
  label: string;
  onLinkClick?: () => void; // Add prop for handling link click
  className?: string;
};
function formatUserName(name?: string) {
  if (!name) return "Your Name";

  const parts = name.trim().split(" ");
  const first = parts[0];

  // only first name
  if (parts.length === 1) return first;

  // first + last
  if (parts.length === 2) {
    const last = parts[1];

    // return full → CSS will truncate if needed
    return `${first} ${last}`;
  }

  // 3+ names → first + middle initial
  return `${first} ${parts[1][0]}`;
}
const NavItem = ({ href, icon, label, onLinkClick,className }: NavItemProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = searchParams.get("tab");
  const view = searchParams.get("view");
  const baseHref = href?.split("?")[0];
  const isActive =
    href === "/dashboard/challenge?tab=join"
      ? pathname === "/dashboard/challenge" && tab === "join"
      : href === "/dashboard/challenge?tab=create"
        ? pathname === "/dashboard/challenge" && tab === "create"
        : href === "/dashboard/accountability/home?view=true"
          ? pathname === "/dashboard/accountability/home" && view === "true"
          : href === "/dashboard/accountability/home"
            ? pathname === "/dashboard/accountability/home" && !view
            : pathname === baseHref;

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
            isActive ? "text-jp-orange" : "text-[#6C7894] dark:text-slate-300",
            className
          )}
          onClick={onLinkClick} // Call onLinkClick when link is clicked
        >
          {content}
        </Link>
      ) : (
        <div
          className={cn(
            "flex items-center py-2 cursor-pointer hover:text-jp-orange text-[#6C7894] dark:text-slate-300",
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
type SidebarProps = {
  user?: UserType;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shouldShowBusinessProfileSetup?:boolean;
  cmpPlanId?:string;
  shouldShowLifeBlueprintSetup?:boolean
};

const NavSection = ({ title, children, className }: NavSectionProps) => (
  <div className={cn("", className)}>
    <h4 className="text-[#405D9F] font-normal text-sm dark:text-slate-400">
      {title}
    </h4>
    <nav>
      <ul className="">{children}</ul>
    </nav>
  </div>
);

// Main sidebar component
const Sidebar = ({ user, isOpen, setIsOpen,shouldShowBusinessProfileSetup,cmpPlanId,shouldShowLifeBlueprintSetup }: SidebarProps) => {

  const pathname = usePathname();

  const session = useSession();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const isCoachOrSoloprenuer =
    session.data?.user.userType == "COACH" ||
    session.data?.user.userType == "SOLOPRENEUR";

    

  return (
    <div className="px-1 md:px-2">
      {/* Hamburger Menu Button for Mobile */}
      <div className="flex items-center pt-1 px-4 gap-4 justify-between w-screen ">
        {/* 🛠️ WRAP THE SEARCH BAR IN A FLEX-GROW DIV */}
        {/* <div className="relative w-full flex-1 lg:hidden">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>

         
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
        </div> */}
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
            "dark:border dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
            "w-64 lg:w-64",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* User Profile Section */}
          <div className="flex flex-col my-6 px-5">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-lg dark:text-slate-400">Hello</p>
                  <h3 className="font-bold text-lg dark:text-slate-50 max-w-[140px] truncate whitespace-nowrap">
                    {formatUserName(user?.name)}
                  </h3>
                  <span className="text-amber-400 text-lg">👋</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col  mt-4">
              {/* Menu Section */}
              <NavSection title="">
                <NavItem
                  href="/dashboard"
                  icon={<LayoutDashboard size={20} />}
                  label="Dashboard"
                  onLinkClick={toggleSidebar}
                />
              </NavSection>
              {/* Settings Section */}
              {isCoachOrSoloprenuer && (
                <NavSection title="">
                  <NavItem
                    href="/dashboard/business-profile"
                    icon={<User size={20} />}
                    label="Setup Business Profile"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                    className={shouldShowBusinessProfileSetup ? " animate-pulse text-blue-600" : ""}
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
                      className={`flex items-center  py-2 text-[#6C7894] dark:text-slate-300  ${pathname === "/dashboard/mini-mastery-programs/create" ? "text-jp-orange" : ""}`}
                    >
                      <GraduationCap size={20} className="w-7" />

                      {/* Extra gap added here */}
                      <span className="font-normal text-[17px] ml-3">
                        Create Mini Mastery Programs
                      </span>
                    </Link>
                  </div>
                  <NavItem
                    href="/dashboard/events/coach"
                    icon={<Calendar size={20} />}
                    label="Manage Events"
                    onLinkClick={toggleSidebar}
                  />
                  <NavItem
                    href="/dashboard/manage-store"
                    icon={<ShoppingCartIcon size={20} />}
                    label="Manage Your Store"
                    onLinkClick={toggleSidebar} // Pass toggleSidebar
                  />

                  <div className="flex items-center ">
                    <Link
                      href="/dashboard/accountability/home"
                      onClick={toggleSidebar}
                      className={`flex items-center  py-2 text-[#6C7894] dark:text-slate-300  ${pathname === "/dashboard/accountability/home" ? "text-jp-orange" : ""}`}
                    >
                      <LayoutDashboard size={20} className="w-7" />

                      {/* Extra gap added here */}
                      <span className="font-normal text-[17px] ml-2">
                        Create Accountability Group
                      </span>
                    </Link>
                  </div>
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
              <section className={`${isCoachOrSoloprenuer ? "mt-4" : ""}`}>
                <NavSection title={`${isCoachOrSoloprenuer ? "Personal Growth Tools" : ""}`}>
                  <div className={`${isCoachOrSoloprenuer ? "mt-2" : ""}`}>
                    <NavItem
                      href={`/dashboard/complete-makeover-program/onboarding?planId=${cmpPlanId}`}
                      icon={<Compass size={20} />}
                      label="Life Blueprint"
                      onLinkClick={toggleSidebar} // Pass toggleSidebar
                      className={`${shouldShowLifeBlueprintSetup ? " animate-pulse text-green-600" : ""}`}
                    />
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
                      label="Log 1% Progress"
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

                    <div className="flex items-center ">
                      <Link
                        href="/dashboard/mini-mastery-programs"
                        onClick={toggleSidebar}
                        className={`flex items-center  py-2 text-[#6C7894] dark:text-slate-300  ${pathname === "/dashboard/mini-mastery-programs" ? "text-jp-orange" : ""}`}
                      >
                        <GraduationCap size={20} className="w-7" />

                        {/* Extra gap added here */}
                        <span className="font-normal text-[17px] ml-2">
                          Join Mini Mastery Programs
                        </span>
                      </Link>
                    </div>
                    <NavItem
                      href="/dashboard/events"
                      icon={<Calendar size={20} />}
                      label="Join Events"
                      onLinkClick={toggleSidebar}
                    />
                    <div className="flex items-center ">
                      <Link href="/MTB-2026-the-complete-makeover-program">
                        <span className="flex items-center gap-3 py-2 cursor-pointer text-[#6C7894] dark:text-slate-300 ">
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
                  </div>
                </NavSection>
              </section>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Sidebar;
