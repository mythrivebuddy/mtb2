"use client";

import DashboardCentrePart from "@/components/adminDashboard/CentrePart";
export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <DashboardCentrePart />
        </div>
      </div>
    </div>
  );
}
