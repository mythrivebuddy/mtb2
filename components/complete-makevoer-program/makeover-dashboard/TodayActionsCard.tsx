/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { useProgramCountdown } from "@/hooks/useProgramCountdown";
import NotStartedYetTasks from "../TodaysActions/NotStartedYetTasks";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";

interface TodayActionsCardProps {
  startDate: Date | null;
  hasThreeActions: boolean;
}
type ApiResponse = {
  visionImage: string | null;
};

const TodayActionsCard = ({
  startDate,
  hasThreeActions,
}: TodayActionsCardProps) => {
  const router = useRouter();
  const { isProgramStarted, timeLeft } = useProgramCountdown(startDate);
  const [openDialog, setOpenDialog] = useState(false);
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["vision-images"],
    queryFn: async () => {
      const res = await axios.get(
        "/api/makeover-program/makeover-dashboard/vision-images"
      );
      return res.data; 
    },
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount:false
  });
  const [openImage, setOpenImage] = useState(false);
  useEffect(() => {
    if (!openImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenImage(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openImage]);

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
  if (isLoading) {
    return (
      <section className="lg:col-span-2 relative bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row overflow-hidden animate-pulse">
        {/* Image skeleton */}
        <div className="sm:w-1/3 h-48 sm:h-auto bg-slate-200 dark:bg-slate-700" />

        {/* Content skeleton */}
        <div className="p-6 sm:p-8 flex flex-col justify-center flex-1 space-y-4">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="h-3 w-28 rounded bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* Title */}
          <div className="h-7 w-52 rounded bg-slate-300 dark:bg-slate-600" />

          {/* Description lines */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Button */}
          <div className="h-11 w-44 rounded-lg bg-slate-300 dark:bg-slate-600 mt-4" />
        </div>
      </section>
    );
  }
  return (
    <section className="lg:col-span-2 relative bg-white dark:bg-[#1a2630] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row group transition-all hover:shadow-md">
      {/* Image */}
      <div
        className={`sm:w-1/3 h-48 sm:h-auto bg-cover object-cover bg-center relative rounded-sm ${data?.visionImage ? "hover:cursor-pointer" : ""}`}
        onClick={() => data?.visionImage && setOpenImage(true)}
        style={{
          backgroundImage: `${data?.visionImage ? `url("${data?.visionImage}")` : "url(https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400)"}`,
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
            {/* You have{" "}
            <span className="font-semibold text-[#1183d4]">
              3 pending tasks
            </span>{" "}
            and{" "}
            <span className="font-semibold text-[#10B981]">
              2 completed tasks
            </span>{" "}
            today. */}
            Stay consistent.
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
      {openImage && data?.visionImage && (
        <AnimatePresence>
          {openImage && data?.visionImage && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setOpenImage(false)}
            >
              <motion.img
                src={data.visionImage}
                alt="Vision full view"
                className="max-w-full max-h-full object-contain"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              />
              <motion.div
                className="absolute bottom-6 rounded-lg bg-slate-900/80
             px-4 py-3 text-sm text-white shadow-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-1">
                  {/* <X className="w-4 h-4 hidden md:inline" /> */}
                  <span className="hidden md:inline">
                    Press <b>ESC</b> or
                  </span>
                  <span className="flex items-center gap-1">Click <X className="inline  w-4 h-4"/> to close</span>
                </div>
              </motion.div>

              {/* Close button */}
              <motion.button
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setOpenImage(false)}
                aria-label="Close image preview"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  );
};

export default TodayActionsCard;
