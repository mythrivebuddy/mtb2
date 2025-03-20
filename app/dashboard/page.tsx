"use client";
import LeftSideBar from "@/components/common/LeftSideBar";
import CentrePartDashboard from "@/components/dashboard/CentrePartDashboard";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex">
        <LeftSideBar />
        <CentrePartDashboard />
      </div>
    </div>
  );
}
