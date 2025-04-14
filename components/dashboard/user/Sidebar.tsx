"use client";

import { usePathname } from "next/navigation";
import React from "react";
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
  Vault,
  Gift,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils/tw";
import { User as UserType } from "@/types/types";
import { ComingSoonWrapper } from "@/components/wrappers/ComingSoonWrapper";
import { signOut } from "next-auth/react";

// Reusable navigation item component
type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  // active?: boolean;
};

const NavItem = ({ href, icon, label, badge }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center",
          isActive ? "text-jp-orange" : "text-[#6C7894]"
        )}
      >
        <div className="w-8">{icon}</div>
        <span className="font-normal text-xl">{label}</span>
        {badge && <span className="ml-1 text-jp-orange">({badge})</span>}
      </Link>
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
  <div className={cn("space-y-6", className)}>
    <h4 className="text-[#405D9F] font-normal text-xl">{title}</h4>
    <nav>
      <ul className="space-y-4">{children}</ul>
    </nav>
  </div>
);

// Main sidebar component
const Sidebar = ({ user }: { user?: UserType }) => {
  return (
    <aside className="w-64 bg-white shadow-lg rounded-3xl  overflow-hidden">
      {/* User Profile Section */}
      <div className="flex flex-col my-8 pl-5">
        <div className=" flex items-center gap-3">
          <div className="h-14 w-14 rounded-lg bg-blue-600 overflow-hidden flex items-center justify-center">
            {user?.name ? (
              <h2 className="text-2xl text-white">
                {user.name.slice(0, 2).toUpperCase()}
              </h2>
            ) : (
              <UserRound />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-base">Hello</p>
              <span className="text-amber-400">👋</span>
            </div>
            <h3 className="font-bold text-xl">
              {user?.name ? user.name : "Your Name"}
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-5 mt-7">
          {/* Menu Section */}
          <NavSection title="Menu">
            <NavItem href="/dashboard" icon={<Home size={20} />} label="Home" />

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
              icon={<Sparkles size={20} />}
              label="Miracle Log"
            />
            <NavItem
              href="/dashboard/progress-vault"
              icon={<Vault size={20} />}
              label="1 % Progress-Vault" />

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
          </NavSection>

          {/* Settings Section */}
          <NavSection title="Settings">
            <NavItem
              href="/dashboard/profile"
              icon={<User size={20} />}
              label="Profile"
            />
            {/* <ComingSoonWrapper>
              <NavItem href="" icon={<HelpCircle size={20} />} label="FAQ's" />
            </ComingSoonWrapper> */}
            <NavItem
              href="/dashboard/faq"
              icon={<HelpCircle size={20} />}
              label="FAQ's"
            />
            <NavItem
              href="/dashboard/contact"
              icon={<Phone size={20} />}
              label="Contact us"
            />
            <button onClick={() => signOut()}>
              <NavItem href="" icon={<LogOut size={20} />} label="Logout" />
            </button>
          </NavSection>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
