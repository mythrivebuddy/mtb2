// /* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart3,
  Check,
  CoinsIcon,
  Copy,
  FileQuestion,
  LogInIcon,
  Trophy,
  User,
} from "lucide-react";
import { getAvatarColor, getInitials } from "@/utils/getInitials";

type AnalyticsResponse = {
  success: boolean;
  data: {
    mostUsedFeature: {
      feature: string;
      usage: number;
    };
    mostActiveUser: {
      userId: string;
      name: string;
      email: string;
      image: string | null;
      activityCount: number;
    };
  };
};

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
const fetchMostActiveUserMostUsedFeature = async () => {
  const res = await axios.get(
    "/api/admin/dashboard/centrepart/analytics/user-and-feature-activity",
  );
  return res.data;
};
const formatFeature = (feature: string) => {
  return feature
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export default function DashboardCentrePart() {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const { data: jpActivityData, refetch: refetchJpActivity } = useQuery({
    queryKey: ["getJpActivity", fromDate, toDate],
    queryFn: () => fetchJpActivity(fromDate, toDate),
  });

  const { data: userStats, refetch: refetchUserStats } = useQuery({
    queryKey: ["userStats", fromDate, toDate],
    queryFn: () => fetchUserStats(fromDate, toDate),
  });
  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ["user-and-feature-activity"],
    queryFn: () => fetchMostActiveUserMostUsedFeature(),
    staleTime: 1000 * 60 * 60 * 24, // ✅ 24 hours
    gcTime: 1000 * 60 * 60 * 24, // ✅ keep cache
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
      {/* ================= Activity Insights ================= */}
      <div>
        <h2 className="text-lg font-medium mb-4">Activity Insights</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ================= Most Used Feature ================= */}
          {isLoading ? (
            <div className="p-4 rounded-xl shadow bg-white space-y-3 animate-pulse">
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-5 w-40 bg-gray-300 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          ) : (
            <div className="p-4 rounded-xl shadow bg-gradient-to-br from-blue-50 to-white flex items-center justify-between">
              <div>
                {/* Label */}
                <div className="text-xs font-medium text-blue-600 mb-1">
                  Most Used Feature
                </div>

                {/* Feature Name */}
                <div className="text-xl font-bold text-gray-900">
                  {formatFeature(data?.data?.mostUsedFeature?.feature || "")}
                </div>

                {/* Usage */}
                {/* <div className="text-sm text-gray-500 mt-1">
            Usage: {data?.data?.mostUsedFeature?.usage}
          </div> */}
              </div>

              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="text-blue-600" />
              </div>
            </div>
          )}

          {/* ================= Most Active User ================= */}
          {isLoading ? (
            <div className="p-4 rounded-xl shadow bg-white space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-3 w-28 bg-gray-200 rounded" />
            </div>
          ) : (
            <div className="p-4 rounded-xl shadow bg-gradient-to-br from-green-50 to-white flex items-center justify-between">
              {(() => {
                const user = data?.data?.mostActiveUser;

                return (
                  <>
                    <div>
                      {/* Label */}
                      <div className="text-xs font-medium text-green-600 mb-2">
                        Most Active User
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {user?.image ? (
                          <img
                            src={user.image}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold ${getAvatarColor(
                              user?.name || "",
                            )}`}
                          >
                            {getInitials(user?.name || "")}
                          </div>
                        )}

                        {/* Info */}
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user?.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{user?.email}</span>

                            <button
                              onClick={() => {
                                if (!user?.email) return;

                                navigator.clipboard.writeText(user.email);
                                setCopied(true);

                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="p-1 rounded hover:bg-gray-100 transition"
                            >
                              {copied ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-gray-500" />
                              )}
                            </button>
                          </div>
                          {/* <div className="text-xs text-gray-400 mt-1">
                      Activity: {user?.activityCount}
                    </div> */}
                        </div>
                      </div>
                    </div>

                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Trophy className="text-green-600" />
                    </div>
                  </>
                );
              })()}
            </div>
          )}
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
