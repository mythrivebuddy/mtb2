"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { Users, Eye, PhoneCall } from "lucide-react";
import ChartContainer from "@/components/insights/ChartContainer";
import SpotlightHistoryTable from "@/components/insights/SpotlightHistoryTable";
import SummaryCard from "@/components/insights/SummaryCard";
import PageLoader from "@/components/PageLoader";

// Update the interface:
// - dailyActivity remains as before.
// - spotlight.active is now a single object (or null), and spotlight.history remains an array.
interface InsightsData {
  dailyActivity: {
    dates: string[];
    logins: number[];
  };
  spotlight: {
    active: {
      id: string;
      views: number;
      clicks: number;
    } | null;
    hourlyMetrics: {
      hour: string;
      views: number;
      clicks: number;
    }[];
    history: {
      applicationDate: string;
      views: number;
      clicks: number;
    }[];
  };
  profileViews: number;
}

// Summary Card Component (remains unchanged)


const InsightsPage = () => {
  const { data, isLoading, error } = useQuery<InsightsData>({
    queryKey: ["insights"],
    queryFn: async () => {
      const response = await axios.get("/api/user/insights");
      return response.data;
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <div className="text-red-500">
        Error loading insights. Please try again later.
      </div>
    );
  }

  // Prepare login chart data (from the past 30 days)
  const loginChartData = data.dailyActivity.dates.map((date, index) => ({
    date: format(new Date(date), "MMM dd"),
    logins: data.dailyActivity.logins[index],
  }));

  // Compute summary values:
  const totalLogins = data.dailyActivity.logins.reduce((a, b) => a + b, 0);
  const spotlightViews = data.spotlight.active
    ? data.spotlight.active.views
    : 0;
  const spotlightClicks = data.spotlight.active
    ? data.spotlight.active.clicks
    : 0;

  // Determine if the user has an active spotlight
  const hasActiveSpotlight = Boolean(data.spotlight.active);

  return (
    <div className="w-full p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Activity Insights</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Total Logins" value={totalLogins} icon={Users} />
        <SummaryCard 
          title="Total Profile Views" 
          value={data.profileViews} 
          icon={Eye}
          tooltip="This represents the total number of times your profile has been viewed, including repeated views from the same users."
        />
        {hasActiveSpotlight && (
          <>
            <SummaryCard
              title="Spotlight Views (Today)"
              value={hasActiveSpotlight ? spotlightViews : 0}
              icon={Eye}
            />
            <SummaryCard
              title="Connect Clicks (Today)"
              value={hasActiveSpotlight ? spotlightClicks : 0}
              icon={PhoneCall}
            />
          </>
        )}
      </div>

      {/* Login Activity Chart (Last 30 Days) */}
      <ChartContainer
        title="Login Activity (Last 30 Days)"
        type="line"
        data={loginChartData}
        xKey="date"
        lines={[
          {
            dataKey: "logins",
            stroke: "#151E46",
            name: "Daily Logins",
          },
        ]}
      />

      {/* Spotlight Section */}
      {hasActiveSpotlight ? (
        <>
          {/* Render active spotlight graph if user currently has a spotlight */}
          <ChartContainer
            title="Active Spotlight Metrics"
            type="bar"
            data={data.spotlight.hourlyMetrics}
            xKey="hour"
            bars={[
              { dataKey: "views", fill: "#151E46", name: "Views" },
              { dataKey: "clicks", fill: "#FF7070", name: "Connect Clicks" },
            ]}
          />

          {/* Previous Spotlight Stats: Show table if history data exists */}
          {data.spotlight.history.length > 0 && (
            <SpotlightHistoryTable history={data.spotlight.history} />
          )}
        </>
      ) : (
        // If no active spotlight, show only the spotlight history (if any)
        data.spotlight.history.length > 0 && (
          <SpotlightHistoryTable history={data.spotlight.history} />
        )
      )}
    </div>
  );
};

export default InsightsPage;
