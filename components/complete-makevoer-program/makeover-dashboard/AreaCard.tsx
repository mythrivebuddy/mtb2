import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";
import { ChevronRight } from "lucide-react";

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

export default AreaCard;
