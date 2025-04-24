"use client";

import { usePathname } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";
import {
  Home,
  BarChart2,
  CreditCard,
  LayoutList,
  MessageCircle,
  User,
  HelpCircle,
  Phone,
  LogOut,
  UserRound,
  Gift,
  Sparkles,
  History,
  ShoppingCartIcon,
  UserPlus,
  Menu,
  WandSparklesIcon,
  LucideSignalHigh,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils/tw";
import { User as UserType } from "@/types/types";
import { ComingSoonWrapper } from "@/components/wrappers/ComingSoonWrapper";
import { signOut } from "next-auth/react";
import ConfirmAction from "@/components/ConfirmAction";

// Reusable navigation item component
type NavItemProps = {
  href?: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
};
const NavItem = ({ href, icon, label, badge }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  const content = (
    <>
      <div className="w-8">{icon}</div>
      <span className="font-normal text-lg">{label}</span>
      {badge && <span className="ml-1 text-jp-orange">({badge})</span>}
    </>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className={cn(
            "flex items-center py-2",
            isActive ? "text-jp-orange" : "text-[#6C7894]"
          )}
        >
          {content}
        </Link>
      ) : (
        <div
          className={cn(
            "flex items-center py-2 cursor-pointer hover:text-jp-orange text-[#6C7894]"
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
    <h4 className="text-[#405D9F] font-normal text-lg">{title}</h4>
    <nav>
      <ul className="">{children}</ul>
    </nav>
  </div>
);

// Main sidebar component
const Sidebar = ({ user }: { user?: UserType }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Hamburger Menu Button for Mobile */}
      <button
        className="lg:hidden fixed top-2 left-4 z-50 p-2 bg-white rounded-md shadow-md"
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
            "fixed lg:static top-0 left-0 h-full bg-white shadow-lg rounded-3xl overflow-y-auto transition-transform duration-300 z-50",
            "w-64 lg:w-64",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* User Profile Section */}
          <div className="flex flex-col my-6 px-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-600 overflow-hidden flex items-center justify-center">
                {user?.name ? (
                  <h2 className="text-xl text-white">
                    {user.name.slice(0, 2).toUpperCase()}
                  </h2>
                ) : (
                  <UserRound size={24} />
                )}
              </div>
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
                <NavItem href="/" icon={<Home size={20} />} label="Home" />
                <NavItem
                  href="/dashboard"
                  icon={<LayoutList size={20} />}
                  label="Dashboard"
                />
                <NavItem
                  href="/dashboard/insights"
                  icon={<BarChart2 size={20} />}
                  label="Insights"
                />
                <NavItem
                  href="/dashboard/subscription"
                  icon={<CreditCard size={20} />}
                  label="Subscription"
                />
                <NavItem
                  href="/dashboard/leaderboard"
                  icon={<LayoutList size={20} />}
                  label="Leaderboard"
                />
                <NavItem
                  href="/dashboard/miracle-log"
                  icon={<WandSparklesIcon size={20} />}
                  label="Miracle Log"
                />
                <NavItem
                  href="/dashboard/progress-vault"
                  icon={<LucideSignalHigh size={20} />}
                  label="1% Progress Vault"
                />
                <NavItem
                  href="/dashboard/aligned-actions"
                  icon={<TrendingUp size={20} />}
                  label="1% Start"
                />
                <NavItem
                  href="/dashboard/prosperity"
                  icon={<Gift size={20} />}
                  label="Prosperity Drops"
                />
                <ComingSoonWrapper>
                  <NavItem
                    href=""
                    icon={<MessageCircle size={20} />}
                    label="Messages"
                    badge={2}
                  />
                </ComingSoonWrapper>
                <NavItem
                  href="/dashboard/spotlight"
                  icon={<Sparkles size={20} />}
                  label="Spotlight"
                />

                <NavItem
                  href="/dashboard/transactions-history"
                  icon={<History size={20} />}
                  label="Transactions"
                />
                <NavItem
                  href="/dashboard/store"
                  icon={<ShoppingCartIcon size={20} />}
                  label="Store"
                />
                {/* <NavItem
                  href="/dashboard/magic-box"
                  icon={<Wand2 size={20} />}
                  label="Magic Box"
                /> */}
              </NavSection>

              {/* Settings Section */}
              <NavSection title="Settings">
                <NavItem
                  href="/dashboard/profile"
                  icon={<User size={20} />}
                  label="Profile"
                />
                <NavItem
                  href="/dashboard/faq"
                  icon={<HelpCircle size={20} />}
                  label="FAQ's"
                />
                <NavItem
                  href="/contact"
                  icon={<Phone size={20} />}
                  label="Contact us"
                />
                <NavItem
                  href="/dashboard/refer-friend"
                  icon={<UserPlus size={20} />}
                  label="Refer a friend"
                />
                <ConfirmAction
                  action={() => signOut()}
                  title="Confirm Logout"
                  description="Are you sure you want to logout? You will need to sign in again to access your account."
                  confirmText="Logout"
                >
                  <button>
                    <NavItem icon={<LogOut size={20} />} label="Logout" />
                  </button>
                </ConfirmAction>
              </NavSection>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
