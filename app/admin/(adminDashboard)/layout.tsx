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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSideBar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm fixed w-full z-10">
          <div className="px-6 py-4 flex items-center justify-between">
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
            <div>ADMIN DASHBOARD</div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="mt-16 p-6">{children}</div>
      </div>
    </div>
  );
}
