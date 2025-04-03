"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function AdminSideBar() {
  const router = useRouter();
  const pathname = usePathname(); // Get current route

  const sidebarItems = [
    { label: "Dashboard", route: "/admin/dashboard" },
    { label: "User Info", route: "/admin/user-info" },
    { label: "Spotlight Application", route: "/admin/spotlight" },
    { label: "Post Blog", route: "/admin/create-blog" },
  ];

  return (
    <div className="w-64 bg-black text-white h-screen fixed">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="relative w-10 h-10">
            <Image
              src="/logo.png"
              alt="MyThriveBuddy"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-semibold">MyThriveBuddy</span>
          <span className="text-xs bg-black px-2 py-0.5 rounded">BETA</span>
        </div>
      </div>

      <nav className="mt-4">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.route}
            label={item.label}
            active={pathname === item.route}
            onClick={() => router.push(item.route)}
          />
        ))}

        <div className="px-4 mt-8">
          <hr className="border-gray-700" />
        </div>

        <SidebarItem label="Logout" onClick={() => signOut()} />
      </nav>
    </div>
  );
}

interface SidebarItemProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

function SidebarItem({ label, active = false, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-left ${
        active ? "bg-blue-600" : "hover:bg-gray-700"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}
