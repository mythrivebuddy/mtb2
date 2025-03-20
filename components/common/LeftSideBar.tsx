"use client";

import React from "react";
import Image from "next/image";
// Import icons from lucide-react (optional)
import {
  Home,
  Lightbulb,
  Bell,
  Mail,
  User,
  HelpCircle,
  LogOut,
  Contact,
} from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  // Add any props if needed, or leave empty
}

const Sidebar: React.FC<SidebarProps> = () => {
  const commonClass =
    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100";
  return (
    <aside
      className="
        flex 
        h-screen 
        w-64 
        flex-col 
        border-r 
        border-gray-200 
        bg-white 
        p-6
      "
    >
      {/* -- Top Section: Profile -- */}
      <div className="mb-8 flex flex-col items-center">
        {/* Example avatar using next/image */}
        <div className="mb-2 h-20 w-20 overflow-hidden rounded-full">
          <Image
            src="/placeholder-avatar.png" // Replace with your image path
            alt="User Avatar"
            width={80}
            height={80}
          />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Hello, Martin M</h2>
      </div>

      {/* -- Main Navigation -- */}
      <nav className="space-y-2">
        <button className={commonClass}>
          <Home className="h-5 w-5" />
          <span>Home</span>
        </button>

        <button className={commonClass}>
          <Lightbulb className="h-5 w-5" />
          <span>Insights</span>
        </button>

        <button className={commonClass}>
          <Bell className="h-5 w-5" />
          <span>Reminders</span>
        </button>

        <button className={commonClass}>
          <Mail className="h-5 w-5" />
          <span>Messages (2)</span>
        </button>
      </nav>

      {/* -- Push footer items to the bottom by using 'mt-auto' -- */}
      <div className="mt-auto space-y-2">
        <button className={commonClass}>
          <User className="h-5 w-5" />
          <span>
            <Link href="/profile">Profile</Link>
          </span>
        </button>

        <button className={commonClass}>
          <HelpCircle className="h-5 w-5" />
          <span>FAQ's</span>
        </button>

        <button className={commonClass}>
          <Contact className="h-5 w-5" />
          <span>Contact us</span>
        </button>

        <button className={commonClass}>
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
