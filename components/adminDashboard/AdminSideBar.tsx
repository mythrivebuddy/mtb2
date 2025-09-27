"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/tw";
import { Menu } from "lucide-react";
import React, { useState } from "react";
import { NavItemProps } from "@/types/client/nav";
import { useQuery} from "@tanstack/react-query";
import axios from "axios";


const NavItem = ({ href, label }: NavItemProps) => {
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
const pathname = usePathname();


const { data: spotlightUnseenCount } = useQuery({
  queryKey: ["spotlightUnseenCount"],
  queryFn: async () => {
    const { data } = await axios.get("/api/admin/spotlight/unseen-count");
    return data;
  },
});
console.log(spotlightUnseenCount);



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
          "fixed lg:static top-0 left-0 h-full bg-white shadow-sm rounded-3xl overflow-y-auto transition-transform duration-300 z-50 flex flex-col",
          "w-64 lg:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col pl-5 py-6 h-full">
          <div className="flex flex-col gap-8 mt-10 flex-grow">
            <NavSection title="Menu">
              <NavItem href="/admin/dashboard" label="Dashboard" />
                  <NavItem href="/admin/announcement" label="Announcement" />
              <NavItem href="/admin/user-info" label="User Management" />
              <NavItem href="/admin/blog" label="Blog Management" />
              <NavItem href="/admin/survey-management" label="Survey Management" />
              <NavItem href="/admin/notification-management" label="Notification Management" />
          

              {/* Spotlight with custom badge */}
                  <li>
  <Link
    href="/admin/spotlight"
    className={cn(
      "flex items-center justify-between py-2 hover:text-jp-orange relative",
      pathname === "/admin/spotlight" ? "text-jp-orange" : "text-[#6C7894]"
    )}
  >
     <span className="font-normal text-lg">Spotlight Management</span>
  
    <span>
    {spotlightUnseenCount?.count !== undefined && spotlightUnseenCount?.count > 0 && (
      <span className="absolute xl:mr-1 right-6 lg:right-8 top-1 px-[0.4rem] py-1 text-[0.5rem] font-semibold bg-red-500 text-white rounded-full">
    {spotlightUnseenCount?.count} 
  </span> )} 
</span>

  
  </Link>
</li>

              <NavItem href="/admin/prosperity" label="Prosperity Drops" />
              <NavItem href="/admin/email-templates" label="Email Templates" />
              <NavItem href="/admin/faq" label="FAQs" />
              <NavItem href="/admin/activity/update-jp" label="JP Management" />
              <NavItem href="/admin/plans" label="Manage Plans" />
              <NavItem href="/admin/manage-store-product" label="Product Management" />
            </NavSection>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
