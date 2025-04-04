"use client";

import AdminSideBar from "@/components/adminDashboard/AdminSideBar";
import { BellIcon } from "lucide-react";
import { useSession } from "next-auth/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession();
  return (
    <div className="flex h-screen p-7 overflow-auto w-full bg-dashboard">
      {/* Sidebar */}
      <AdminSideBar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pl-7">
        {/* Header */}
        <header className="h-16 bg-white px-10 rounded-lg flex items-center justify-between">
          <div className="flex justify-between gap-8 w-full items-center">
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <BellIcon />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  {session?.data?.user?.name?.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium">{session?.data?.user.name}</span>
              </div>
            </div>
            <div>
              <h1>ADMIN DASHBOARD</h1>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 mt-8 overflow-auto bg-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}
