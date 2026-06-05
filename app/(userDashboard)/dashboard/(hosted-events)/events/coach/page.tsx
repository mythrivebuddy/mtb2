"use client";

import React from "react";
import { theme } from "@/lib/new-home/theme/theme"; // Adjust path as needed
import { Plus, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageSkeleton from "@/components/PageSkeleton";
import { getGreetingData } from "@/lib/utils/utils";
import Link from "next/link";
import Share from "@/components/common/ShareModal";

// 1. DEFINE TYPES MATCED TO THE API PAYLOAD
interface DashboardStats {
  totalRevenue: string;
  activeRegistrations: number;
  upcomingEventsCount: number;
  averageRating: string;
}

interface ActiveEvent {
  id: string;
  title: string;
  date: string;
  progress: number;
  total: number;
  badge: string;
  badgeLight: boolean;
  imgSrc: string;
}

interface DashboardData {
  stats: DashboardStats;
  activeEvents: ActiveEvent[];
}

export default function CoachDashboard() {

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await axios.get("/api/hosted-events/me");
      return res.data;
    },
  });
  const router = useRouter();
  const session = useSession();
  const { text } = getGreetingData();
  if (isLoading) {
    return <PageSkeleton type="events" />;
  }
  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${theme.textDark}`}>
      {/* MAIN CONTENT */}
      <main className="flex-1 px-4  py-12  overflow-y-auto">
        <div className="mx-auto space-y-10">
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className={`${theme.typography.h1} text-4xl mb-3`}>
                {text}, {session?.data?.user?.name ?? "Coach"}.
              </h1>
              <p className={`text-lg ${theme.textAccent}`}>
                {/* Your community is thriving.  */}
                {/* You have{" "}
                {data?.stats?.upcomingEventsCount ?? 0} upcoming events this
                week and a 12% increase in new registrations since Monday. */}
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/events/create")}
              className={`${theme.buttonDark} flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium w-full md:w-auto shrink-0 transition-colors ease-linear`}
            >
              <Plus size={18} />
              Create Event
            </button>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="TOTAL REVENUE"
              value={data?.stats?.totalRevenue ?? "N/A"}
              subtext=""
            />
            <StatCard
              title="ACTIVE REGISTRATIONS"
              value={
                data?.stats?.activeRegistrations !== undefined
                  ? String(data.stats.activeRegistrations)
                  : "N/A"
              }
              subtext=""
            />
            <StatCard
              title="UPCOMING EVENTS"
              value={
                data?.stats?.upcomingEventsCount !== undefined
                  ? String(data.stats.upcomingEventsCount)
                  : "N/A"
              }
              subtext=""
            />
            <div
              className={`bg-white rounded-2xl p-6 border ${theme.borderLight}`}
            >
              <h3 className="text-sm tracking-widest mb-4">
                AVERAGE RATING
              </h3>
              <div className="text-3xl font-medium mb-2">
                {data?.stats?.averageRating ?? "N/A"}
              </div>
              {data?.stats?.averageRating !== "N/A" && (
                <div className="flex gap-1 text-[#C48A5A]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} fill="currentColor" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN (Events & Chart) */}
            <div className="lg:col-span-3 space-y-10">
              {/* ACTIVE EVENTS */}
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h2 className={`${theme.typography.h1} text-2xl`}>
                    Active Event
                  </h2>
                  <p
                    className={`text-sm ${theme.textAccent} hover:underline`}
                  >
                    View all
                  </p>
                </div>

                <div className="space-y-6">
                  {isError && (
                    <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded-2xl">
                      Error fetching dashboard data. Please try again later.
                    </div>
                  )}

                  {!isLoading &&
                    !isError &&
                    data?.activeEvents?.length === 0 && (
                      <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500">
                        No active events scheduled.
                      </div>
                    )}

                  {!isLoading &&
                    !isError &&
                    data?.activeEvents?.map((event) => (
                      <EventCard
                        key={event.id}
                        id={event.id}
                        title={event.title}
                        date={event.date}
                        progress={event.progress}
                        total={event.total}
                        badge={event.badge}
                        badgeLight={event.badgeLight}
                        imgSrc={event.imgSrc}
                      />
                    ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* --- REUSABLE COMPONENTS WITH PROPS TYPING --- */

function StatCard({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string;
  subtext: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 md:p-6 border ${theme.borderLight} flex flex-col justify-between`}
    >
      <h3 className="text-sm tracking-widest mb-4 uppercase">
        {title}
      </h3>
      <div>
        <div className="text-2xl md:text-3xl font-medium mb-2">{value}</div>
        <div className={`text-xs md:text-sm ${theme.textAccent}`}>
          {subtext}
        </div>
      </div>
    </div>
  );
}

function EventCard({
  id,
  title,
  date,
  progress,
  total,
  badge,
  badgeLight,
  imgSrc,
}: {
  id:string
  title: string;
  date: string;
  progress: number;
  total: number;
  badge: string;
  badgeLight: boolean;
  imgSrc: string;
}) {
  const safeTotal = total > 0 ? total : 1;
  const percentage = (progress / safeTotal) * 100;
    const eventUrl = typeof window !== "undefined"
    ? `${window.location.origin}/dashboard/events/${id}`
    : `/dashboard/events/${id}`;
  return (
    <Link href={`/dashboard/events/${id}`}
      className={`bg-white rounded-2xl border ${theme.borderLight} overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="h-48 md:h-auto md:w-64 bg-gray-200 relative shrink-0">
        <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className={`${theme.typography.h1} text-2xl`}>{title}</h3>
            <div className="flex flex-col items-end gap-4">
                     {/* Stop propagation so share click doesn't navigate */}
              <div onClick={(e) => e.preventDefault()}>
                <Share url={eventUrl} title={title} />
              </div>

            <span
              className={`text-[10px] font-bold px-2 py-1 rounded tracking-wider ${
                badgeLight
                ? "bg-gray-200 text-gray-700"
                  : "bg-[#C47D55] text-white"
              }`}
              >
              {badge}
            </span>
      
                </div>
                
          </div>
          <p className={theme.highLightTextColor + " text-sm mb-6"}>{date}</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1 w-full max-w-sm">
            <div className="flex justify-between text-xs mb-2">
              <span className="font-medium">Registration Progress</span>
              <span>
                {progress} / {total} slots
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C47D55] rounded-full"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
          {/* <button className="px-6 py-2 border border-gray-300 rounded-full text-sm font-medium hover:border-gray-900 transition-colors shrink-0">
            Manage
          </button> */}
        </div>
      </div>
    </Link>
  );
}

// function SidebarItem({
//   icon,
//   label,
//   active = false,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   active?: boolean;
// }) {
//   return (
//     <a
//       href="#"
//       className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
//         active ? "bg-[#4A3828] text-white" : "text-gray-700 hover:bg-[#EAE4DB]"
//       }`}
//     >
//       {icon}
//       <span className="font-medium">{label}</span>
//     </a>
//   );
// }

// function Bar({
//   height,
//   label,
//   color,
// }: {
//   height: string;
//   label: string;
//   color: string;
// }) {
//   return (
//     <div className="flex flex-col items-center justify-end h-full w-full max-w-[40px]">
//       <div className={`w-full ${color} rounded-t-md`} style={{ height }} />
//       <span className="text-xs text-gray-400 mt-3">{label}</span>
//     </div>
//   );
// }

// function ActivityItem({
//   initials,
//   bgColor,
//   text,
//   time,
// }: {
//   initials: string;
//   bgColor: string;
//   text: React.ReactNode;
//   time: string;
// }) {
//   return (
//     <div className="flex gap-4">
//       <div
//         className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center shrink-0 font-bold text-sm text-gray-800`}
//       >
//         {initials}
//       </div>
//       <div>
//         <p className="text-sm text-gray-800 leading-snug">{text}</p>
//         <span className="text-xs text-gray-400 mt-1 block">{time}</span>
//       </div>
//     </div>
//   );
// }
