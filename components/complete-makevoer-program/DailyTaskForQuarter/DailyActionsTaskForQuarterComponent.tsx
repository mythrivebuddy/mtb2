"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OnboardingStickyFooter from "../OnboardingStickyFooter";
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Leaf } from "lucide-react";
import { AREA_ICON_MAP } from "@/lib/utils/makeover-program/makeover-icons";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/* ───────────── TYPES ───────────── */

interface Area {
  id: number;
  name: string;
  description: string;
}
interface UserDailyAction {
  areaId: number;
  actionId: string;
  actionText: string;
}

interface DailyAction {
  id: string;
  areaId: number;
  title: string;
  isCustom: boolean;
}
interface NormalizedArea {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

interface ApiResponse {
  success: boolean;
  areas: Area[];
  dailyActions: DailyAction[];
  userDailyActions?: UserDailyAction[];
}

/* ───────────── COMPONENT ───────────── */

export default function DailyActionsTaskForQuarterComponent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(0);
  const [actions, setActions] = useState<Record<number, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["daily-actions-for-quarter"],
    queryFn: async () => {
      const res = await axios.get(
        "/api/makeover-program/makeover-dashboard/daily-actions-task-for-quarter"
      );
      return res.data;
    },
  });

  const areas = useMemo<NormalizedArea[]>(() => {
    if (!data?.areas) return [];

    return data.areas.map((a) => ({
      id: String(a.id),
      name: a.name,
      description: a.description ?? "",
      icon: (AREA_ICON_MAP[a.id] ?? Leaf) as LucideIcon,
    }));
  }, [data]);

  // Updated mutation to accept actionId
  const updateDailyActionsMutation = useMutation({
    mutationFn: async (payload: {
      dailyActions: {
        areaId: number;
        customText: string;
        actionId: string | null;
      }[];
    }) => {
      const res = await axios.patch(
        "/api/makeover-program/makeover-dashboard/daily-actions-task-for-quarter/update",
        payload
      );
      return res.data;
    },
  });

  /* ───────────── CAROUSEL LOGIC ───────────── */

  const handleScroll = () => {
    if (!scrollRef.current || !data) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const idx = Math.round(scrollLeft / clientWidth);
    if (idx !== activeIndex && idx >= 0 && idx < data.areas.length) {
      setActiveIndex(idx);
    }
  };

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: scrollRef.current.offsetWidth * index,
      behavior: "smooth",
    });
  };

  const isLast = data ? activeIndex === data.areas.length - 1 : false;
  useEffect(() => {
    if (!data?.userDailyActions?.length) return;

    const initialActions: Record<number, string> = {};

    data.userDailyActions.forEach((item) => {
      initialActions[item.areaId] = item.actionText;
    });

    setActions(initialActions);
  }, [data]);

  /* ───────────── ERROR STATE ───────────── */

  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={32} />
          <h2 className="text-lg font-bold text-red-900 mb-2">
            Failed to load daily actions
          </h2>
          <p className="text-sm text-red-600 mb-6">
            {(error as Error)?.message ?? "Something went wrong"}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-full text-sm font-semibold"
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ───────────── LOADING STATE ───────────── */

  if (isLoading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-emerald-700 font-medium">
          Preparing your daily action flow…
        </p>
      </div>
    );
  }

  const handleSubmitDailyActions = async () => {
    const dailyActionsPayload = Object.entries(actions)
      .filter(([, value]) => value && value.trim().length > 0)
      .map(([areaId, value]) => {
        const id = Number(areaId);
        const text = value.trim();

        // Check if the submitted text matches a predefined action for this area
        const matchedAction = data.dailyActions.find(
          (action) => action.areaId === id && action.title === text
        );

        return {
          areaId: id,
          customText: text,
          // If match found, send ID, otherwise null
          actionId: matchedAction ? matchedAction.id : null,
        };
      });

    if (dailyActionsPayload.length === 0) {
      toast.error("Please enter at least one daily action before proceeding.");
      return;
    }

    try {
      await updateDailyActionsMutation.mutateAsync({
        dailyActions: dailyActionsPayload,
      });

      //  move to next step / route
      toast.success("Daily actions saved successfully!");
      await queryClient.invalidateQueries({
        queryKey: ["daily-actions-for-quarter"],
      });
      await router.push(
        "/dashboard/complete-makeover-program/makeover-dashboard"
      );
    } catch (err) {
      console.error("Failed to save daily actions", err);
    }
  };

  /* ───────────── MAIN UI ───────────── */
  const currentAreaId = Number(areas[activeIndex]?.id);

  const MIN_ACTION_LENGTH = 5;

  const hasCurrentAreaAction =
    !!actions[currentAreaId] &&
    actions[currentAreaId].trim().length >= MIN_ACTION_LENGTH;

  const hasAnyAction = Object.values(actions).some(
    (v) => v && v.trim().length >= MIN_ACTION_LENGTH
  );

  return (
    <div className="min-h-screen font-['Inter'] text-[#0d101b]">
      <main className="mx-auto px-4 lg:px-10 py-6">
        <div className="grid grid-cols-1 sm:max-w-[1024px] gap-4 mx-auto">
          {/* Heading */}
          <div className="text-center mt-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              Choose Your Daily Actions
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
              Select one daily action per area. This becomes your non-negotiable
              habit for the quarter.
            </p>
          </div>

          {/* Carousel */}
          <div className="relative mt-6">
            {/* Desktop Nav */}
            <button
              disabled={activeIndex === 0}
              onClick={() => scrollTo(activeIndex - 1)}
              className="hidden lg:flex absolute justify-center items-center left-0 top-1/2 -translate-y-1/2 -translate-x-12 size-12 rounded-full bg-white border shadow text-[#059669]"
            >
              <ChevronLeft size={28} />
            </button>

            <button
              disabled={!hasCurrentAreaAction || isLast}
              onClick={() => scrollTo(activeIndex + 1)}
              className={`hidden lg:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 size-12 rounded-full bg-white border shadow text-[#059669] ${
                !hasCurrentAreaAction || isLast
                  ? "opacity-40 pointer-events-none"
                  : ""
              }`}
            >
              <ChevronRight size={28} />
            </button>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6"
            >
              {areas.map((area, idx) => {
                const suggestions = data.dailyActions.filter(
                  (a) => a.areaId === Number(area.id)
                );
                const Icon = area.icon;
                return (
                  <div
                    key={area.id}
                    className="min-w-full snap-center flex justify-center"
                  >
                    <div
                      className={`w-full rounded-2xl border p-6 sm:p-8 shadow-xl transition-all ${
                        idx === activeIndex
                          ? "opacity-100 scale-[1.01]"
                          : "opacity-40 scale-95 pointer-events-none"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-6 pb-6 border-b">
                        <div className="flex items-center gap-4">
                          <div className="size-14 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center">
                            <Icon size={32} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{area.name}</h3>
                            <p className="text-sm text-slate-500">
                              {area.description}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-xs font-bold text-[#059669]">
                          {idx + 1}/{data.areas.length}
                        </span>
                      </div>

                      {/* Input */}
                      <label className="text-sm font-semibold text-[#059669] mb-2 block">
                        Your daily action
                      </label>

                      <input
                        value={actions[Number(area.id)] ?? ""}
                        onChange={(e) =>
                          setActions((p) => ({
                            ...p,
                            [area.id]: e.target.value,
                          }))
                        }
                        placeholder="Type or choose below…"
                        className="w-full rounded-xl border bg-inherit border-emerald-600 p-4 focus:ring-2 focus:ring-[#059669]"
                      />
                      {actions[Number(area.id)] &&
                        actions[Number(area.id)].trim().length <
                          MIN_ACTION_LENGTH && (
                          <span className="ml-2 text-xs text-red-500">
                            Minimum {MIN_ACTION_LENGTH} characters required.
                          </span>
                        )}

                      {/* Mobile Select */}
                      <div className="mt-6 sm:hidden">
                        <Select
                          onValueChange={(v) =>
                            setActions((p) => ({ ...p, [area.id]: v }))
                          }
                        >
                          <SelectTrigger className="h-12 border-emerald-600 rounded-xl text-center border w-full">
                            <SelectValue placeholder="Choose a suggestion" />
                          </SelectTrigger>
                          <SelectContent>
                            {suggestions.map((s) => (
                              <SelectItem key={s.id} value={s.title}>
                                {s.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Desktop ScrollArea */}
                      <div className="hidden sm:block ">
                        <ScrollArea.Root className="mt-6 h-[122px] overflow-hidden">
                          <ScrollArea.Viewport className="h-full w-full">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pr-4 text-emerald-700">
                              {suggestions.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() =>
                                    setActions((p) => ({
                                      ...p,
                                      [area.id]: s.title,
                                    }))
                                  }
                                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-white border hover:bg-emerald-50"
                                >
                                  <Plus size={14} />
                                  {s.title}
                                </button>
                              ))}
                            </div>
                          </ScrollArea.Viewport>
                          <ScrollArea.Scrollbar orientation="vertical" />
                        </ScrollArea.Root>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 mt-4">
              {data.areas.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`h-2 rounded-full ${
                    i === activeIndex
                      ? "w-8 bg-[#059669]"
                      : "w-2 bg-emerald-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <OnboardingStickyFooter
            onBack={() => {
              if (activeIndex === 0) {
                router.back(); //  leave onboarding
              } else {
                scrollTo(activeIndex - 1); //  previous slide
              }
            }}
            onNext={() =>
              isLast ? handleSubmitDailyActions() : scrollTo(activeIndex + 1)
            }
            nextLabel={isLast ? "Proceed" : "Next Area"}
            disabled={
              updateDailyActionsMutation.isPending ||
              (!isLast && !hasCurrentAreaAction) ||
              (isLast && !hasAnyAction)
            }
          />
        </div>
      </main>
    </div>
  );
}
