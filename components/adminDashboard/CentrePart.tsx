// /* eslint-disable @typescript-eslint/no-unused-vars */


"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CoinsIcon, FileQuestion, LogInIcon, User } from "lucide-react";

const fetchJpActivity = async (fromDate: string, toDate: string) => {
  const res = await axios.get("/api/admin/dashboard/centrepart/getJpActivity", {
    params: { fromDate, toDate },
  });
  return res.data;
};

const fetchUserStats = async (fromDate: string, toDate: string) => {
  const res = await axios.get("/api/admin/dashboard/centrepart/getUserStats", {
    params: { fromDate, toDate },
  });
  return res.data;
};

export default function DashboardCentrePart() {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const { data: jpActivityData, refetch: refetchJpActivity } = useQuery({
    queryKey: ["getJpActivity", fromDate, toDate],
    queryFn: () => fetchJpActivity(fromDate, toDate),
  });

  const { data: userStats, refetch: refetchUserStats } = useQuery({
    queryKey: ["userStats", fromDate, toDate],
    queryFn: () => fetchUserStats(fromDate, toDate),
  });

  useEffect(() => {
    refetchJpActivity();
    refetchUserStats();
  }, [fromDate, toDate, refetchJpActivity, refetchUserStats]);

  return (
    <div className="space-y-6">
      {/* GP Circulation & Activity */}
      <div className="flex flex-col sm:flex-row sm:justify-end  sm:items-center gap-4 mb-4">
        <label htmlFor="from-date" className="font-medium mr-2 text-sm">
          From:
        </label>
        <input
          id="from-date"
          type="date"
          className="border rounded px-3 text-sm py-1 focus:outline-none"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <label htmlFor="to-date" className="font-medium mr-2 text-sm">
          To:
        </label>
        <input
          id="to-date"
          type="date"
          className="border rounded px-3 text-sm py-1 focus:outline-none"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button
          className="ml-2 px-4 py-1 rounded-lg bg-blue-600 text-white"
          onClick={() => {
            setFromDate("");
            setToDate("");
          }}
        >
          Reset
        </button>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">GP Circulation & Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon="jp-coin"
            value={jpActivityData?.totalJpDistributed}
            label="Total GP Distributed to users"
            bgColor="bg-dark-navy"
          />
          <MetricCard
            icon="jp-coin"
            value={jpActivityData?.totalJpSpent}
            label="Total GP Spent  by users"
            bgColor="bg-dark-navy"
          />
          <MetricCard
            icon="jp-coin"
            value={jpActivityData?.totalJpBalance}
            label="Total GP Balance of all users"
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
