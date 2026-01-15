/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import HeaderOfDailyTodaysActions from "./HeaderOfDailyTodaysActions";
import PaginationIndicatorsDailyActions from "./PaginationIndicatorsDailyActions";
import { useProgramCountdown } from "@/hooks/useProgramCountdown";
import NotStartedYetTasks from "./NotStartedYetTasks";
import OnboardingStickyFooter from "../OnboardingStickyFooter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { MakeoverPointsSummary } from "../makeover-dashboard/AreaCard";
import { isSunday } from "date-fns";
import WeekdayActionCard from "./WeekDayActionCard";

/* ---------------- Types ---------------- */
export type Commitment = {
  id: string;
  areaId: number;
  areaName: string; // Added
  areaDescription: string; // Added
  goalText: string;
  identityText: string;
  actionText: string;
  isLocked: boolean;
};
export type ChecklistState = {
  identityDone: boolean;
  actionDone: boolean;
  winLogged: boolean;
};
const TASK_LABEL: Record<"identityDone" | "actionDone" | "winLogged", string> =
  {
    identityDone: "Identity task",
    actionDone: "Action task",
    winLogged: "Win log",
  };

/* ---------------- Main Component ---------------- */
export default function TodaysActionsClient({
  startDate,
  commitments,
}: {
  startDate: Date | null;
  commitments: Commitment[];
}) {
  // State 1: Current Slide Index
  // const isTodaySunday = isSunday();
  const isTodaySunday = isSunday(new Date());
  console.log({ isTodaySunday });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mounted, timeLeft, isProgramStarted } =
    useProgramCountdown(startDate);

  const [checklistByArea, setChecklistByArea] = useState<
    Record<number, ChecklistState>
  >({});

  // Derived state for Carousel
  const totalSlides = commitments.length;
  const activeSlide = commitments[currentSlideIndex];

  const hasRedirectedRef = useRef(false);

  const lockQuery = useQuery({
    queryKey: ["today-lock-status"],
    queryFn: async () => {
      const res = await axios.get(
        "/api/makeover-program/makeover-daily-tasks/today-lock"
      );
      return res.data as {
        isDayLocked: boolean;
        unlockAt?: string;
      };
    },

    // 🔒 DO NOT refetch during the day
    // staleTime: Infinity,
    // cacheTime: Infinity,
    // refetchOnWindowFocus: true,
    // refetchOnReconnect: true,
  });

  const todayProgressQuery = useQuery({
    queryKey: ["today-progress"],
    queryFn: async () => {
      const res = await axios.get(
        "/api/makeover-program/makeover-daily-tasks/today-progress"
      );
      return res.data.data as {
        areaId: number;
        identityDone: boolean;
        actionDone: boolean;
        winLogged: boolean;
      }[];
    },
    enabled: isProgramStarted,
  });

  useEffect(() => {
    if (!todayProgressQuery.data) return;

    const mapped: Record<number, ChecklistState> = {};

    todayProgressQuery.data.forEach((log) => {
      mapped[log.areaId] = {
        identityDone: log.identityDone,
        actionDone: log.actionDone,
        winLogged: log.winLogged,
      };
    });

    setChecklistByArea((prev) => ({
      ...prev,
      ...mapped,
    }));
  }, [todayProgressQuery.data]);

  const unlockDate = React.useMemo(() => {
    if (!lockQuery.data?.unlockAt) return null;

    const now = new Date();

    // next LOCAL midnight
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
  }, [lockQuery.data?.unlockAt]);

  const { timeLeft: dayUnlockTimeLeft, isProgramStarted: isDayUnlocked } =
    useProgramCountdown(unlockDate);
  useEffect(() => {
    if (!lockQuery.data?.unlockAt) return;

    const unlockTime = new Date(lockQuery.data.unlockAt).getTime();
    const now = Date.now();
    const delay = unlockTime - now;

    if (delay <= 0) return;

    const timer = setTimeout(() => {
      lockQuery.refetch();
    }, delay);

    return () => clearTimeout(timer);
  }, [lockQuery.data?.unlockAt]);

  useEffect(() => {
    if (!todayProgressQuery.data || commitments.length === 0) return;

    // map areaId → checklist
    const progressMap = new Map(
      todayProgressQuery.data.map((log) => [
        log.areaId,
        log.identityDone && log.actionDone && log.winLogged,
      ])
    );

    // find first incomplete area in commitments order
    const firstIncompleteIndex = commitments.findIndex((c) => {
      return progressMap.get(c.areaId) !== true;
    });

    if (firstIncompleteIndex !== -1) {
      setCurrentSlideIndex(firstIncompleteIndex);
    }
  }, [todayProgressQuery.data, commitments]);

  const currentChecklist: ChecklistState = {
    identityDone: checklistByArea[activeSlide.areaId]?.identityDone ?? false,
    actionDone: checklistByArea[activeSlide.areaId]?.actionDone ?? false,
    winLogged: checklistByArea[activeSlide.areaId]?.winLogged ?? false,
  };

  const updateChecklist = (field: keyof ChecklistState, value: boolean) => {
    const areaId = activeSlide.areaId;

    // optimistic UI
    setChecklistByArea((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        [field]: value,
      },
    }));

    checkboxMutation.mutate({
      areaId,
      field,
      value,
      actionText: activeSlide.actionText,
    });
  };

  // Handlers for Carousel
  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const checkboxMutation = useMutation<
    { success: boolean; pointsAwarded: number },
    unknown,
    {
      areaId: number;
      field: "identityDone" | "actionDone" | "winLogged";
      value: boolean;
      actionText: string;
    }
  >({
    mutationFn: async ({
      areaId,
      field,
      value,
      actionText,
    }: {
      areaId: number;
      field: "identityDone" | "actionDone" | "winLogged";
      value: boolean;
      actionText: string;
    }) => {
      const res = await axios.post(
        "/api/makeover-program/makeover-daily-tasks",
        {
          areaId,
          field,
          value,
          actionText,
          date: new Date().toISOString(),
        }
      );

      return res.data as {
        success: boolean;
        pointsAwarded: number;
      };
    },

    onSuccess: (data, variables) => {
      if (data?.success && data.pointsAwarded > 0) {
        const { field } = variables;

        toast.success(
          `${TASK_LABEL[field]} completed in "${activeSlide.areaName}" — +${data.pointsAwarded} points 🎉`
        );

        queryClient.setQueryData(
          ["makeover-points-summary"],
          (oldData: MakeoverPointsSummary[] | undefined) => {
            const safeData = oldData ?? [];

            const exists = safeData.some(
              (item) => item.areaId === activeSlide.areaId
            );

            if (!exists) {
              return [
                ...safeData,
                {
                  areaId: activeSlide.areaId,
                  totalPoints: data.pointsAwarded,
                },
              ];
            }

            return safeData.map((item) =>
              item.areaId === activeSlide.areaId
                ? {
                    ...item,
                    totalPoints: item.totalPoints + data.pointsAwarded,
                  }
                : item
            );
          }
        );
      }
    },

    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const isDayLocked = lockQuery.data?.isDayLocked;

  const areAllAreasCompleted = React.useMemo(() => {
    if (!commitments.length) return false;

    return commitments.every((c) => {
      const checklist = checklistByArea[c.areaId];
      return (
        checklist?.identityDone && checklist?.actionDone && checklist?.winLogged
      );
    });
  }, [commitments, checklistByArea]);

  const isIdentityDisabled = isDayLocked || currentChecklist.identityDone;
  const isActionDisabled = isDayLocked || currentChecklist.actionDone;
  const isWinDisabled = isDayLocked || currentChecklist.winLogged;

  const isLockResolved = lockQuery.isSuccess;

  useEffect(() => {
    if (!mounted) return;
    if (!isLockResolved) return; //  wait for lock state
    if (hasRedirectedRef.current) return;
    if (isDayLocked) return;

    if (areAllAreasCompleted ) {
      hasRedirectedRef.current = true;
      queryClient.invalidateQueries({
    queryKey: ["today-lock-status"],
  });
      router.push("/dashboard/complete-makeover-program/makeover-dashboard");
    }
  }, [areAllAreasCompleted, isDayLocked, isLockResolved, mounted, router]);

  // Prevent hydration mismatch
  if (!mounted) return null;

  // VIEW 1: Waiting Room (Timer)
  if (!isProgramStarted) {
    return (
      <main className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <NotStartedYetTasks
          timeLeft={timeLeft}
          isBack={true}
          startDate={startDate}
          title="Program Locked"
          description={
            <>
              Your transformation journey is being prepared.
              <br />
              Get ready to start.
            </>
          }
        />
      </main>
    );
  }
  if (lockQuery.isLoading) {
    return (
      <div className="w-full min-h-screen bg-dashboard flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }
  // 🔒 Day locked → show countdown till midnight
  if (
    isProgramStarted &&
    lockQuery.data?.isDayLocked &&
    unlockDate &&
    !isDayUnlocked
  ) {
    return (
      <main className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <NotStartedYetTasks
          timeLeft={dayUnlockTimeLeft}
          startDate={unlockDate}
          isBack={true}
          title="All Tasks Completed 🎉"
          description={
            <>
              You’ve completed all your tasks for today.
              <br />
              Come back tomorrow to continue.
            </>
          }
        />
      </main>
    );
  }

  // Fallback if no data
  if (totalSlides === 0) {
    return (
      <div className="p-8 text-center">
        No commitments found for this program.
      </div>
    );
  }
  const isLast = currentSlideIndex === totalSlides - 1;

  const handleSubmitDailyActions = () => {
    if (!isLast) {
      setCurrentSlideIndex((i) => i + 1);
      return;
    }

    if (areAllAreasCompleted) {
      router.push("/dashboard/complete-makeover-program/makeover-dashboard");
    }
  };

  // VIEW 2: Main Carousel Page
  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <HeaderOfDailyTodaysActions />
      {/* Main Carousel Area */}

      {!isTodaySunday && (
        <WeekdayActionCard
          commitments={commitments}
          currentSlideIndex={currentSlideIndex}
          handlePrev={handlePrev}
          handleNext={handleNext}
          activeSlide={activeSlide}
          checklist={currentChecklist}
          isIdentityDisabled={isIdentityDisabled}
          isActionDisabled={isActionDisabled}
          isWinDisabled={isWinDisabled}
          updateChecklist={updateChecklist}
          isLast={isLast}
        />
      )}
      {/* Pagination Indicators */}
      <PaginationIndicatorsDailyActions
        commitments={commitments}
        setCurrentSlideIndex={setCurrentSlideIndex}
        currentSlideIndex={currentSlideIndex}
        // disabled={!isAreaCompleted}
      />
      <OnboardingStickyFooter
        onBack={() => {
          if (currentSlideIndex !== 0) {
            setCurrentSlideIndex((i) => i - 1);
          }
        }}
        onNext={handleSubmitDailyActions}
        nextLabel={"Next"}
        backDisabled={currentSlideIndex === 0}
        disabled={isLast}
      />
    </main>
  );
}
