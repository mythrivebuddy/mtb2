import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function resolveLevelIcon(icon: string | null): LucideIcon {
  if (!icon) return Icons.Award;

  const icons = Icons as unknown as Record<string, LucideIcon>;
  return icons[icon] ?? Icons.Award;
}


export function getBadgeStyles(
  name: string,
  type: "LEVEL" | "MILESTONE" | null,
  isUnlocked: boolean
) {
  // 🔒 LOCKED — neutral, matte, no glow
  if (!isUnlocked) {
    return {
      colorClass: "text-slate-400 dark:text-slate-500",
      bgClass: "bg-slate-100 dark:bg-slate-800/60",
      ringClass: "ring-1 ring-slate-200 dark:ring-slate-700",
    };
  }

  // 🧬 LEVEL BADGES — identity, grounded, premium
  if (type === "LEVEL") { 
    switch (name) {
      case "Initiator Badge":
        return {
          colorClass: "text-sky-600 dark:text-sky-400",
          bgClass: "bg-sky-100 dark:bg-sky-900/40",
          ringClass:
            "ring-2 ring-sky-300/40 dark:ring-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]",
        };

      case "Consistent Badge":
        return {
          colorClass: "text-orange-600 dark:text-orange-400",
          bgClass: "bg-orange-100 dark:bg-orange-900/40",
          ringClass:
            "ring-2 ring-orange-300/40 dark:ring-orange-500/30 shadow-[0_0_12px_rgba(251,146,60,0.25)]",
        };

      case "Embodied Badge":
        return {
          colorClass: "text-indigo-600 dark:text-indigo-400",
          bgClass: "bg-indigo-100 dark:bg-indigo-900/40",
          ringClass:
            "ring-2 ring-indigo-300/40 dark:ring-indigo-500/30 shadow-[0_0_14px_rgba(99,102,241,0.28)]",
        };

      case "Transforming Badge":
        return {
          colorClass: "text-purple-600 dark:text-purple-400",
          bgClass: "bg-purple-100 dark:bg-purple-900/40",
          ringClass:
            "ring-2 ring-purple-300/40 dark:ring-purple-500/30 shadow-[0_0_14px_rgba(168,85,247,0.3)]",
        };

      case "Master Badge":
        return {
          colorClass: "text-amber-600 dark:text-amber-400",
          bgClass: "bg-amber-100 dark:bg-amber-900/45",
          ringClass:
            "ring-2 ring-amber-300/50 dark:ring-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.35)]",
        };
    }
  }

  // 🏁 MILESTONE BADGES — celebratory, brighter, punchier
  if (type === "MILESTONE") {
    switch (name) {
      case "Bronze Progress Badge":
        return {
          colorClass: "text-amber-700 dark:text-amber-500",
          bgClass: "bg-amber-100 dark:bg-amber-900/35",
          ringClass: "ring-2 ring-amber-400/40 dark:ring-amber-600/40",
        };

      case "Silver Consistency Badge":
        return {
          colorClass: "text-emerald-600",
          bgClass: "bg-emerald-100 ",
          ringClass: "ring-2 ring-slate-300/40 dark:ring-slate-500/30",
        };

      case "Gold Identity Badge":
        return {
          colorClass: "text-yellow-600 dark:text-yellow-400",
          bgClass: "bg-yellow-100 dark:bg-yellow-900/40",
          ringClass:
            "ring-2 ring-yellow-300/50 dark:ring-yellow-500/40 shadow-[0_0_14px_rgba(234,179,8,0.35)]",
        };

      case "Diamond Discipline Badge":
        return {
          colorClass: "text-cyan-600 dark:text-cyan-400",
          bgClass: "bg-cyan-100 dark:bg-cyan-900/40",
          ringClass:
            "ring-2 ring-cyan-300/50 dark:ring-cyan-500/40 shadow-[0_0_14px_rgba(34,211,238,0.35)]",
        };

      case "Elite Growth Badge":
        return {
          colorClass: "text-emerald-600 dark:text-emerald-400",
          bgClass: "bg-emerald-100 dark:bg-emerald-900/40",
          ringClass:
            "ring-2 ring-emerald-300/50 dark:ring-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.35)]",
        };

      case "Mastery Path Badge":
        return {
          colorClass: "text-blue-600 dark:text-blue-400",
          bgClass: "bg-blue-100 dark:bg-blue-900/40",
          ringClass:
            "ring-2 ring-blue-300/50 dark:ring-blue-500/40 shadow-[0_0_14px_rgba(59,130,246,0.35)]",
        };

      case "Half-Year Mastery Badge":
        return {
          colorClass: "text-violet-600 dark:text-violet-400",
          bgClass: "bg-violet-100 dark:bg-violet-900/40",
          ringClass:
            "ring-2 ring-violet-300/50 dark:ring-violet-500/40 shadow-[0_0_14px_rgba(139,92,246,0.35)]",
        };

      case "Century Badge":
        return {
          colorClass: "text-rose-600 dark:text-rose-400",
          bgClass: "bg-rose-100 dark:bg-rose-900/40",
          ringClass:
            "ring-2 ring-rose-300/50 dark:ring-rose-500/40 shadow-[0_0_14px_rgba(244,63,94,0.35)]",
        };

      case "Year Completion Badge":
        return {
          colorClass: "text-green-700 dark:text-green-400",
          bgClass: "bg-green-100 dark:bg-green-900/45",
          ringClass:
            "ring-2 ring-green-300/50 dark:ring-green-500/40 shadow-[0_0_16px_rgba(34,197,94,0.4)]",
        };
    }
  }

  // 🛟 Safe fallback
 return {
  colorClass: "text-slate-500 dark:text-slate-400",
  bgClass: "bg-slate-100 dark:bg-slate-800/50",
  ringClass: "ring-1 ring-slate-300 dark:ring-slate-600",
};
}