/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { useProgramCountdown } from "@/hooks/useProgramCountdown";
import NotStartedYetTasks from "../TodaysActions/NotStartedYetTasks";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface TodayActionsCardProps {
  startDate: Date | null;
  hasThreeActions: boolean;
}

const TodayActionsCard = ({
  startDate,
  hasThreeActions,
}: TodayActionsCardProps) => {
  const router = useRouter();
  const { isProgramStarted, timeLeft } = useProgramCountdown(startDate);
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenTodayActions = () => {
    // 1️⃣ Actions missing → force setup (always)
    if (!hasThreeActions) {
      router.push(
        "/dashboard/complete-makeover-program/daily-actions-task-for-quarter"
      );
      return;
    }

    // 2️⃣ Actions exist but program not started → show dialog
    if (!isProgramStarted) {
      setOpenDialog(true);
      return;
    }

    // 3️⃣ Actions exist & program started → go to today
    router.push("/dashboard/complete-makeover-program/todays-actions");
  };

  return (
    <section className="lg:col-span-2 relative bg-white dark:bg-[#1a2630] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row group transition-all hover:shadow-md">
      {/* Image */}
      <div
        className="sm:w-1/3 h-48 sm:h-auto bg-cover bg-center relative"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/10" />
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8 flex flex-col justify-center flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="size-2 rounded-full bg-[#FBBF24] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Action Required
          </span>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Today's Actions
        </h3>

        {isProgramStarted ? (
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
        ) : (
          <p className="text-slate-600 dark:text-slate-300 mb-6 text-base leading-relaxed">
            Your daily actions will start soon. Get ready to build momentum.
          </p>
        )}

        <button
          onClick={handleOpenTodayActions}
          className={`w-full sm:w-fit h-11 px-6 bg-[#1183d4] hover:bg-[#0c62a0] text-white rounded-lg font-semibold shadow-sm transition-all flex items-center justify-center gap-2 group
    ${!isProgramStarted ? "opacity-70 cursor-pointer" : "opacity-100"}
  `}
        >
          <span>Open Today's Actions</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Dialog (controlled) */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="p-0 overflow-hidden">
            <VisuallyHidden>
              <DialogTitle>Today's Actions Not Started</DialogTitle>
            </VisuallyHidden>
            <NotStartedYetTasks timeLeft={timeLeft} startDate={startDate} />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default TodayActionsCard;
