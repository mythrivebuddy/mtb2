"use client";

import AdminSideBar from "@/components/adminDashboard/AdminSideBar";
import { BellIcon, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession();

  return (
    <div className="flex min-h-screen w-full bg-dashboard px-4 sm:px-6 lg:px-7 py-7">
      {/* Sidebar */}
      <AdminSideBar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-7 pt-16 lg:pt-0">
        {/* Header */}
        <header className="h-16 bg-white px-6 sm:px-8 lg:px-10 rounded-lg flex items-center justify-between">
          <div className="flex justify-between gap-4 sm:gap-8 w-full items-center">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <BellIcon size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  {session?.data?.user?.name?.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium text-sm sm:text-base">
                  {session?.data?.user.name}
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <button onClick={() => signOut()}>
                <LogOut>Logout</LogOut>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 mt-6 overflow-auto bg-transparent ">
          {children}
        </div>
      </div>
    </div>
  );
}
