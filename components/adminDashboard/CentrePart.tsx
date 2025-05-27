"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CoinsIcon, FileQuestion, LogInIcon, User } from "lucide-react";

const fetchJpActivity = async () => {
  const res = await axios.get("/api/admin/dashboard/centrepart/getJpActivity");
  console.log(res.data);
  return res.data;
};

const fetchUserStats = async () => {
  const res = await axios.get("/api/admin/dashboard/centrepart/getUserStats");
  return res.data;
};

export default function DashboardCentrePart() {
  const { data: jpActivityData } = useQuery({
    queryKey: ["getJpActivity"],
    queryFn: () => fetchJpActivity(),
  });
  const { data: userStats } = useQuery({
    queryKey: ["userStats"],
    queryFn: () => fetchUserStats(),
  });
  return (
    <div className="space-y-6">
      {/* JP Circulation & Activity */}
      <div>
        <h2 className="text-lg font-medium mb-4">JP Circulation & Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon="jp-coin"
            value={jpActivityData?.totalJpDistributed}
            label="Total JP Distributed to users"
            bgColor="bg-dark-navy"
          />
          <MetricCard
            icon="jp-coin"
            value={jpActivityData?.totalJpSpent}
            label="Total JP Spent  by users"
            bgColor="bg-dark-navy"
          />
          <MetricCard
            icon="jp-coin"
            value={jpActivityData?.totalJpBalance}
            label="Total JP Balance of all users"
            bgColor="bg-dark-navy"
          />
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg font-medium mb-4">Total Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon="users"
            value={userStats?.totalUsers}
            label="Active Users"
            bgColor="white"
            textColor="text-red-500"
          />
          <MetricCard
            icon="users"
            value={userStats?.recentSignups}
            label="New Signups"
            bgColor="white"
          />
          <MetricCard
            icon="users"
            value={userStats?.blockedUsers}
            label="Blocked Users"
            bgColor="white"
          />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: "jp-coin" | "users" | "login" | "quiz" | "prosperity";
  value: number;
  label: string;
  bgColor?: string;
  textColor?: string;
}

function MetricCard({
  icon,
  value,
  label,
  bgColor = "bg-white",
  textColor = "text-gray-900",
}: MetricCardProps) {
  return (
    <div className={`p-4 rounded-lg shadow ${bgColor}`}>
      <div className="flex justify-between items-center">
        <div>
          <div className={`text-xl font-bold ${textColor}`}>{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
        <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
          {icon === "jp-coin" && <CoinsIcon />}
          {icon === "users" && <User />}
          {icon === "login" && <LogInIcon />}
          {icon === "quiz" && <FileQuestion />}
          {icon === "prosperity" && <LogInIcon />}
        </div>
      </div>
    </div>
  );
}
