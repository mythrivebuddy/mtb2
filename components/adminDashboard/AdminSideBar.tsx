"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/tw";
import { Menu } from "lucide-react";
import React, { useState } from "react";

type NavItemProps = {
  href: string;
  label: string;
  badge?: string | number;
};

const NavItem = ({ href, label, badge }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center py-2 hover:text-jp-orange",
          isActive ? "text-jp-orange" : "text-[#6C7894]"
        )}
      >
        <span className="font-normal text-lg">{label}</span>
        {badge && <span className="ml-1 text-jp-orange">({badge})</span>}
      </Link>
    </li>
  );
};

type NavSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

const NavSection = ({ title, children, className }: NavSectionProps) => (
  <div className={cn("space-y-6", className)}>
    <h4 className="text-blue font-normal text-lg">{title}</h4>
    <nav>
      <ul className="space-y-4">{children}</ul>
    </nav>
  </div>
);

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Hamburger Menu Button for Mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
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
      <aside
        className={cn(
          "fixed lg:static top-0 left-0 h-full bg-white shadow-sm rounded-3xl overflow-y-auto transition-transform duration-300 z-50",
          "w-64 lg:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Menu Section */}
        <div className="flex flex-col pl-5 py-6">
          <div className="flex flex-col gap-8 mt-10">
            <NavSection title="Menu">
              <NavItem href="/admin/dashboard" label="Dashboard" />
              <NavItem href="/admin/user-info" label="User Info" />
              <NavItem href="/admin/spotlight" label="Spotlight" />
              <NavItem href="/admin/blog" label="Create Blog" />
              <NavItem href="/admin/email-templates" label="Email Templates" />
              <NavItem href="/admin/prosperity" label="Prosperity" />
              <NavItem href="/admin/faq" label="Faqs" />
              <NavItem href="/admin/activity/update-jp" label="Manage Jp" />
              <NavItem href="/admin/plans" label="Plans" />
              <NavItem
                href="/admin/manage-store-product"
                label="Manage Store Products"
              />
            </NavSection>

         
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;