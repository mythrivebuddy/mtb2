/* eslint-disable react/no-unescaped-entities */
import React from "react";
import {
  Sparkles,
  Clock,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  PlaneTakeoff,
  Medal,
  Brain,
  Footprints,
  Landmark,
  BookOpen,
  ChevronRight,
  Gift,
  Lock,
  Users,
  MessageSquare,
  Eye,
} from "lucide-react";
import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";

const DashboardPage = () => {
  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight mb-2">
              Week 12 of 51 • Quarter 1
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800">
              <Clock className="w-4 h-4" />
              <span>18 days left in this quarter</span>
            </div>
          </div>
          <button className="mt-3 md:mt-0 inline-flex items-center gap-2 h-11 px-5  bg-[#1183d4] hover:bg-[#0c62a0] text-white rounded-lg transition group-invalid:">
            <Sparkles className="w-4 h-4" />
            Set this quarter’s actions
          </button>
          <div className="text-right hidden md:block">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">
              "Keep showing up. You're building the new you."
            </p>
          </div>
        </div>

        {/* Top Section: Actions & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dominant Action Card */}

          <div className="lg:col-span-2 relative bg-white dark:bg-[#1a2630] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-200 dark:border-slate-700  flex flex-col sm:flex-row group transition-all hover:shadow-md">
            <div
              className="sm:w-1/3 h-48 sm:h-auto bg-cover bg-center relative"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/10"></div>
            </div>
            <StaticDataBadge className="w-fit absolute -top-2 -left-4 " />
            <div className="p-6 sm:p-8  flex flex-col justify-center flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-[#FBBF24] animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Action Required
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Today's Actions
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-base leading-relaxed">
                You have{" "}
                <span className="font-semibold text-[#1183d4]">
                  3 pending tasks
                </span>{" "}
                and{" "}
                <span className="font-semibold text-[#10B981]">
                  2 completed tasks
                </span>{" "}
                today. Stay consistent.
              </p>
              <button className="w-full sm:w-fit h-11 px-6 bg-[#1183d4] hover:bg-[#0c62a0] text-white rounded-lg font-semibold shadow-sm transition-all flex items-center justify-center gap-2 group">
                <span>Open Today's Actions</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Insight Card */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-[#1a2630] dark:to-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 dark:border-slate-700 p-6 flex flex-col relative ">
            <StaticDataBadge className="w-fit relative -top-8 -left-8 " />
            <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900 dark:text-white">
              <Lightbulb className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-2 mb-4 text-[#F59E0B]">
              <Lightbulb className="w-5 h-5 fill-current" />
              <span className="text-sm font-bold uppercase tracking-wider">
                Daily Insight
              </span>
            </div>
            <blockquote className="text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed mb-4 flex-grow z-10">
              "Consistency beats intensity. You are 12% ahead of where you were
              last quarter. Trust the compound effect."
            </blockquote>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <TrendingUp className="w-4 h-4" />
              <span>Based on your recent logs</span>
            </div>
          </div>
        </div>

        {/* Global Progress Section */}
        <div className="bg-white dark:bg-[#1a2630] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
          <StaticDataBadge className="w-fit relative -top-10 -left-12 " />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PlaneTakeoff className="w-6 h-6 text-[#1183d4]" />
              Goa Journey Progress
            </h3>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Target: December 2026
            </span>
          </div>
          <div className="relative h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6 shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-[#1183d4] rounded-full transition-all duration-1000 ease-out"
              style={{ width: "24%" }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
            </div>
            <span className="absolute top-0 left-2 h-full flex items-center text-xs font-bold text-white pl-1 drop-shadow-md">
              24%
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
                <Medal className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                  Current Level
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Level 3: Initiate
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Next level at 30% completion
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-800">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                  Current Identity State
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  The Consistent Creator
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Focus: Daily small wins over big leaps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Area Snapshots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AreaCard
            title="Health & Vitality"
            goal="Run 50km"
            progress={45}
            points={120}
            color="#10B981"
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
            icon={<Footprints className="w-5 h-5" />}
          />
          <AreaCard
            title="Wealth & Career"
            goal="Launch MVP"
            progress={72}
            points={340}
            color="#F59E0B"
            bgColor="bg-amber-50 dark:bg-amber-900/20"
            icon={<Landmark className="w-5 h-5" />}
          />
          <AreaCard
            title="Wisdom & Peace"
            goal="Read 3 Books"
            progress={25}
            points={85}
            color="#1183d4"
            bgColor="bg-indigo-50 dark:bg-indigo-900/20"
            icon={<BookOpen className="w-5 h-5" />}
          />
        </div>

        {/* Bottom Grid: Bonus & Community */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bonus & Rewards */}
          <div className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
            <StaticDataBadge className="w-fit relative -top-8 -left-8 " />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                Bonus & Rewards
              </h3>
              <button className="text-xs font-semibold text-[#1183d4] hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className="size-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-[#10B981]">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Next Self-Reward: Spa Weekend
                  </p>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#10B981] h-1.5 rounded-full"
                      style={{ width: "80%" }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Unlock at 500 total points (420/500)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg opacity-70">
                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Monthly Bonus: 1:1 Coaching Call
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Complete 90% of habit logs to unlock
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-bold rounded uppercase">
                  Locked
                </span>
              </div>
            </div>
          </div>

          {/* Accountability Pod */}
          <div className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
            <StaticDataBadge className="w-fit relative -top-8 -left-8 " />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1183d4]" />
                Accountability Pod
              </h3>
              <button className="text-xs font-semibold text-[#1183d4] hover:underline">
                Find Buddies
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <BuddyItem
                name="Arjun K."
                active="2h ago"
                image="https://i.pravatar.cc/150?u=arjun"
              />
              <BuddyItem
                name="Priya S."
                active="10m ago"
                image="https://i.pravatar.cc/150?u=priya"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Helper Components ---

interface AreaCardProps {
  title: string;
  goal: string;
  progress: number;
  points: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const AreaCard = ({
  title,
  goal,
  progress,
  points,
  color,
  bgColor,
  icon,
}: AreaCardProps) => (
  <div className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-[#1183d4]/30 transition-colors group">
    <StaticDataBadge className="w-fit relative -top-8 -left-8 " />
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`} style={{ color }}>
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">{title}</h4>
          <span className="text-xs text-slate-500 font-medium">
            Q1 Goal: {goal}
          </span>
        </div>
      </div>
      <div
        className="relative size-12 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${progress}%, #e2e8f0 0)`,
        }}
      >
        <div className="absolute inset-1 bg-white dark:bg-[#1a2630] rounded-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
            {progress}%
          </span>
        </div>
      </div>
    </div>
    <div className="flex justify-between items-end mt-2">
      <div>
        <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
          Area Points
        </p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">
          {points}{" "}
          <span className="text-xs font-normal text-slate-500">pts</span>
        </p>
      </div>
      <button className="text-sm text-[#1183d4] font-medium hover:underline flex items-center gap-1">
        View <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const BuddyItem = ({
  name,
  active,
  image,
}: {
  name: string;
  active: string;
  image: string;
}) => (
  <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
    <div className="flex items-center gap-3">
      <div
        className="size-10 rounded-full bg-cover bg-center border border-slate-200"
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {name}
        </p>
        <p className="text-xs text-slate-500">Last active: {active}</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#1183d4] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <MessageSquare className="w-4 h-4" />
      </button>
      <button className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#1183d4] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <Eye className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default DashboardPage;
