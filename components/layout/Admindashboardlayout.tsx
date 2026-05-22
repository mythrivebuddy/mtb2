"use client";

import { useSession } from "next-auth/react";
import AdminSideBar from "@/components/adminDashboard/AdminSideBar";
import { Toaster } from "sonner";

import AdminDashboardHeader from "../adminDashboard/AdminDashboardHeader";

const AdminDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  if (session.status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-dashboard px-4 sm:px-6 lg:px-7 py-7">
      {/* Sidebar */}
      <AdminSideBar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:px-4 pt-16 lg:pt-0">
        {/* Header */}
        <AdminDashboardHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-auto   bg-transparent pt-4">
          {children}
          <Toaster richColors position="top-right" />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
