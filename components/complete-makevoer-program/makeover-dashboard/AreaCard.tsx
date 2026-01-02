import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";
import { ComingSoonWrapper } from "@/components/wrappers/ComingSoonWrapper";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface AreaCardProps {
  title: string;
  label: string;
  goal: string;
  progress: number;
  points: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const AreaCard = ({
  title,
  label,
  goal,
  progress,
  points,
  color,
  bgColor,
  icon,
}: AreaCardProps) => (
  <div className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-[#1183d4]/30 transition-colors group">
    <StaticDataBadge label={label} className="w-fit relative -top-8 -left-8 " />
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
    <div className="flex justify-between items-center mt-4">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
            Area Points
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {points}{" "}
            <span className="text-xs font-normal text-slate-500">pts</span>
          </p>
        </div>
        <div className="">
          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
            Buddy
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {} <span className="text-xs font-normal text-slate-500"></span>
          </p>
        </div>
      </div>
      <div className="flex flex-col items-start gap-6">
        <Link
          href="#"
          className="text-sm text-[#1183d4] font-medium hover:underline flex items-center gap-1"
        >
          View Group
          <ChevronRight className="w-4 h-4" />
        </Link>
        <ComingSoonWrapper>
          <button className="text-sm text-[#1183d4] font-medium hover:underline mt-2 hover:cursor-pointer">
            Find Coaches
          </button>
        </ComingSoonWrapper>
      </div>
    </div>
  </div>
);

export default AreaCard;
