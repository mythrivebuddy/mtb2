"use client";

import {
  GraduationCap,
  ShoppingCart,
  ArrowRight,
  type LucideIcon,
  TrendingUp,
  Flower,
  BellRing,
  LucideSignalHigh,
  WandSparklesIcon,
  Swords,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";
import { DashboardContent } from "@/types/client/dashboard";
import { useState } from "react";

type AlignedAction = {
  id: string;
  completed: boolean;
};

type DailyBloom = {
  id: string;
  title: string;
  isCompleted: boolean;
  alignedActionId?: string | null;
  isFromEvent?: boolean;
};
type CardItem = {
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  highlight?: boolean;
  badge?: string;
  action?: boolean;
  path?: string;
};
type Props = {
  jpBalance: string;
} & DashboardContent;

const cards: CardItem[] = [
  {
    type: "alignedAction",
    title: "Set Today’s Focus",
    description:
      "Define your top priorities and stay focused throughout the day",
    icon: TrendingUp,
    bg: "bg-emerald-100 group-hover:bg-emerald-600",
    text: "text-emerald-600 group-hover:text-white",
    path: "/dashboard/aligned-actions",
  },
  {
    type: "dailyBloom",
    title: "Plan the Day",
    description:
      "Organize your schedule clearly and plan tasks with better flow",
    icon: Flower,
    bg: "bg-blue-100 group-hover:bg-blue-600",
    text: "text-blue-600 group-hover:text-white",
    path: "/dashboard/daily-bloom",
  },
  {
    type: "reminders",
    title: "Set Reminders",
    description:
      "Get timely alerts so you never miss important tasks or events",
    icon: BellRing,
    bg: "bg-red-100 group-hover:bg-red-500",
    text: "text-red-500 group-hover:text-white",
    path: "/dashboard/reminders",
  },
  {
    type: "progressVault",
    title: "Log 1% Progress",
    description: "Track small daily wins and build consistent growth over time",
    icon: LucideSignalHigh,
    bg: "bg-green-100 group-hover:bg-green-500",
    text: "text-green-700 group-hover:text-white",
    path: "/dashboard/progress-vault",
  },
  {
    type: "miracleLog",
    title: "Log Miracles",
    description: "Capture meaningful moments and reflect on unexpected wins",
    icon: WandSparklesIcon,
    bg: "bg-indigo-100 group-hover:bg-indigo-500",
    text: "text-indigo-600 group-hover:text-white",
    path: "/dashboard/miracle-log",
  },
  {
    type: "challenges",
    title: "Join Challenges",
    description: "Participate in challenges to stay consistent and grow daily",
    icon: Swords,
    bg: "bg-pink-100 group-hover:bg-pink-500",
    text: "text-pink-600 group-hover:text-white",
    path: "/dashboard/challenge?tab=join",
  },
  {
    type: "mmp",
    title: "Mini Mastery Programs",
    description:
      "Learn new skills with short programs designed for daily growth",
    icon: GraduationCap,
    bg: "bg-gray-200 group-hover:bg-gray-700",
    text: "text-gray-700 group-hover:text-white",
    path: "/dashboard/mini-mastery-programs",
  },

  {
    type: "store",
    title: "Growth Store",
    description: "",
    icon: ShoppingCart,
    bg: "bg-gradient-to-br from-emerald-500 to-green-500",
    text: "text-white",
    highlight: true,
    action: true,
    path: "/dashboard/store",
  },
  {
    type: "groups",
    title: "View Groups",
    description: "Stay accountable with your accountability hub groups",
    icon: LayoutDashboard, // or Users if you prefer
    bg: "bg-yellow-100 group-hover:bg-yellow-500",
    text: "text-yellow-600 group-hover:text-white",
  },
];

export default function DashboardCards({
  jpBalance,
  alignedAction,
  dailyBlooms,
  onePercentProgressVault,
  miracleLogs,
  challenges,
  mmpPrograms,
  accountabilityHubGroups,
  events,
}: Props) {
  const router = useRouter();

  const queryClient = useQueryClient();
  const [localCompleted, setLocalCompleted] = useState<Record<string, boolean>>(
    {},
  );

  const completeActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const res = await fetch("/api/user/aligned-actions/reminders", {
        method: "POST",
        body: JSON.stringify({ actionId, completed: true }),
      });

      if (!res.ok) throw new Error("Failed to complete action");
    },
    onSuccess: (_, actionId) => {
      queryClient.setQueryData<DashboardContent>(
        ["dashboard-content"],
        (old) => {
          if (!old) return old;

          return {
            ...old,

            // ✅ update aligned action
            alignedAction: old.alignedAction.map((a) =>
              a.id === actionId ? { ...a, completed: true } : a,
            ),

            // 🔥 FIX: update linked blooms INSIDE dashboard cache
            dailyBlooms: old.dailyBlooms.map((b) =>
              b.alignedActionId === actionId ? { ...b, isCompleted: true } : b,
            ),
          };
        },
      );
      const today = new Date().toISOString().split("T")[0];
      // ✅ aligned-actions page cache (NO any)
      queryClient.setQueryData<AlignedAction[]>(
        ["aligned-actions", today],
        (old) =>
          old?.map((a) =>
            a.id === actionId ? { ...a, completed: true } : a,
          ) ?? old,
      );

      // ✅ daily-blooms cache
      queryClient.setQueryData<DailyBloom[]>(
        ["dailyBloom"],
        (old) =>
          old?.map((b) =>
            b.alignedActionId === actionId ? { ...b, isCompleted: true } : b,
          ) ?? old,
      );
      queryClient.invalidateQueries({
        queryKey: ["dailyBloom"],
        refetchType: "inactive", // 🔥 avoids refetching active UI immediately
      });
      toast.success("Task completed 🎉");
    },
  });

  const updateBloomMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.put(`/api/user/daily-bloom/${id}`, {
        isCompleted: true,
      });

      return res.data as {
        id: string;
        isCompleted: boolean;
        alignedActionId?: string | null;
      };
    },

    onSuccess: (data, id) => {
      const updatedBloom = data as {
        id: string;
        isCompleted: boolean;
        alignedActionId?: string | null;
      };
      setLocalCompleted((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      const { alignedActionId, isCompleted } = updatedBloom;

      queryClient.setQueryData<DashboardContent>(
        ["dashboard-content"],
        (old) => {
          if (!old) return old;

          return {
            ...old,

            // update bloom
            dailyBlooms: old.dailyBlooms.filter((b) => b.id !== id),
            // 🔥 sync aligned action
            alignedAction: alignedActionId
              ? old.alignedAction.map((a) =>
                  a.id === alignedActionId
                    ? { ...a, completed: isCompleted }
                    : a,
                )
              : old.alignedAction,
          };
        },
      );

      // ✅ 2. update aligned-actions cache
      const today = new Date().toISOString().split("T")[0];
      if (alignedActionId) {
        queryClient.setQueryData<AlignedAction[]>(
          ["aligned-actions", today],
          (old) =>
            old?.map((a) =>
              a.id === alignedActionId ? { ...a, completed: isCompleted } : a,
            ) ?? old,
        );
      }

      // ✅ 3. update daily-blooms cache
      queryClient.setQueryData<DailyBloom[]>(
        ["dailyBloom"],
        (old) => old?.filter((b) => b.id !== id) ?? old,
      );
      queryClient.invalidateQueries({
        queryKey: ["dailyBloom"],
        refetchType: "inactive", // 🔥 avoids refetching active UI immediately
      });
      toast.success("Bloom completed ✅");
    },
    onError: (_err, id) => {
      // ❌ revert checkbox if API fails
      setLocalCompleted((prev) => {
        const updated = { ...prev };
        delete updated[id]; // remove local override
        return updated;
      });

      toast.error("Failed to complete bloom");
    },
  });

  const todayAction = alignedAction?.[0];
  const hasTodayFocus = !!todayAction;
  // aligned action tasks
  const task =
    todayAction?.tasks?.find((t: string) => t === todayAction?.selectedTask) ||
    todayAction?.selectedTask;
  // bloooms
  const blooms = (dailyBlooms ?? []).slice(0, 3);
  // onePercentProgressVault
  const progressItems = onePercentProgressVault?.slice(0, 3);

  // miracle logs
  const miracleItems = miracleLogs?.slice(0, 3); // keep short like progress
  // challenges
  const challengeItems = challenges?.slice(0, 3);

  // mmp
  const mmpItems = mmpPrograms?.slice(0, 3);
  const groupItems = (accountabilityHubGroups ?? []).slice(0, 3);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // ✅ 24-hour format
    });

  const time =
    todayAction?.timeFrom && todayAction?.timeTo
      ? `${formatTime(todayAction.timeFrom)} - ${formatTime(
          todayAction.timeTo,
        )}`
      : "";

  const isCompleted = todayAction?.completed;
  const dynamicCards: CardItem[] = [
    {
      type: "alignedAction",
      title: hasTodayFocus ? "Your Today’s Focus" : "Set Today’s Focus",
      description: hasTodayFocus
        ? `${task} • ${time}`
        : "Define your top priorities and stay focused throughout the day",

      icon: TrendingUp,

      bg: hasTodayFocus
        ? "bg-emerald-200 group-hover:bg-emerald-700"
        : "bg-emerald-100 group-hover:bg-emerald-600",

      text: "text-emerald-600 group-hover:text-white",

      path: "/dashboard/aligned-actions",
    },

    //  cards same
    cards.find((c) => c.type === "dailyBloom")!,
  ];
  // ✅ Add Event Card if it exists
  if (events?.length > 0) {
    dynamicCards.push({
      type: "event",
      title: "My Events",
      description: "", // we will render inside UI
      icon: CalendarDays,
      bg: "bg-purple-100 group-hover:bg-purple-600",
      text: "text-purple-600 group-hover:text-white",
      path: "/dashboard/daily-bloom",
    });
  }

  dynamicCards.push(
    cards.find((c) => c.type === "reminders")!,
    cards.find((c) => c.type === "progressVault")!,
    cards.find((c) => c.type === "miracleLog")!,
    cards.find((c) => c.type === "challenges")!,
    cards.find((c) => c.type === "mmp")!,
    cards.find((c) => c.type === "store")!,
    cards.find((c) => c.type === "groups")!,
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {dynamicCards.map((card, index) => {
        const hasCTA =
          (card.type === "dailyBloom" && blooms.length > 0) ||
          (card.type === "progressVault" && progressItems.length > 0) ||
          (card.type === "miracleLog" && miracleItems.length > 0) ||
          (card.type === "challenges" && challengeItems.length > 0) ||
          (card.type === "mmp" && mmpItems.length > 0) ||
          (card.type === "groups" && groupItems.length > 0) ||
          card.action;
        return (
          <Card
            key={index}
            onClick={() => {
              // if (index === 0) return;
              if (hasCTA) return; // 🚫 block navigation if CTA exists
              if (card.path) router.push(card.path);
            }}
            className={cn(
              "group relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl border",
              card.highlight
                ? "border-emerald-200 overflow-hidden"
                : "border-gray-200",
            )}
          >
            <CardContent className="p-4 flex flex-col h-full">
              {/* Badge */}
              {card.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-600">
                  {card.badge}
                </span>
              )}

              {/* Icon */}
              {/* Header: Icon + Title inline */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                    card.bg,
                  )}
                >
                  <card.icon
                    className={cn(
                      "w-5 h-5 transition-colors duration-300",
                      card.text,
                    )}
                  />
                </div>

                <h3 className="text-sm sm:text-base font-semibold leading-tight">
                  {card.title}
                </h3>
              </div>

              {/* Description */}
              <div className="flex flex-col flex-1 mt-1">
                {card.type === "alignedAction" && hasTodayFocus ? (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Input
                      type="checkbox"
                      checked={isCompleted}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCompleted || completeActionMutation.isPending)
                          return;
                        if (!isCompleted && todayAction?.id) {
                          completeActionMutation.mutate(todayAction.id);
                        }
                      }}
                      className={cn(
                        "w-4 h-4 accent-blue-600",
                        isCompleted || completeActionMutation.isPending
                          ? "cursor-not-allowed"
                          : "cursor-pointer",
                      )}
                    />
                    <p className="text-muted-foreground">
                      {task} • {time}
                    </p>
                  </div>
                ) : card.type === "dailyBloom" && blooms.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {blooms.map((bloom) => (
                      <div
                        key={bloom.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Input
                          type="checkbox"
                          checked={
                            localCompleted[bloom.id] ?? bloom.isCompleted
                          }
                          onChange={(e) => {
                            e.stopPropagation();

                            if (
                              bloom.isCompleted ||
                              updateBloomMutation.isPending
                            )
                              return;

                            setLocalCompleted((prev) => ({
                              ...prev,
                              [bloom.id]: true,
                            }));

                            updateBloomMutation.mutate(bloom.id);
                          }}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <p className="text-muted-foreground line-clamp-1">
                          {bloom.title}
                          {bloom.isFromEvent && (
                            <span className="text-xs text-blue-600 font-medium bg-blue-100 px-1.5 py-0.5 rounded ml-1">
                              Event
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : card.type === "event" && events.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <p className="text-muted-foreground line-clamp-1">
                          {event.title} • {event.startTime}
                          {event.endTime ? ` - ${event.endTime}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : card.type === "progressVault" &&
                  progressItems.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {progressItems.map((item) => (
                      <p
                        key={item.id}
                        className="text-sm text-muted-foreground line-clamp-1"
                      >
                        {item.content}
                      </p>
                    ))}
                  </div>
                ) : card.type === "miracleLog" && miracleItems.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {miracleItems.map((item) => (
                      <p
                        key={item.id}
                        className="text-sm text-muted-foreground line-clamp-1"
                      >
                        ✨ {item.content}
                      </p>
                    ))}
                  </div>
                ) : card.type === "challenges" && challengeItems.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {challengeItems.map((item) => (
                      <Link
                        href={`/dashboard/challenge/my-challenges/${item.challenge.id}?from=dashboard`}
                        key={item.challenge.id}
                        className="text-sm text-muted-foreground line-clamp-1"
                      >
                        🔥{" "}
                        <span className="hover:text-blue-600 hover:underline">
                          {item.challenge.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : card.type === "mmp" && mmpItems.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {mmpItems.map((item) => (
                      <Link
                        href={`/dashboard/mini-mastery-programs/program/${item.program.id}?from=dashboard`}
                        key={item.program.id}
                        className="text-sm text-muted-foreground line-clamp-1"
                      >
                        🎓{" "}
                        <span className="hover:text-blue-600 hover:underline">
                          {item.program.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : card.type === "groups" && groupItems.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {groupItems.map((group) => (
                      <Link
                        href={`/dashboard/accountability?groupId=${group.id}`}
                        key={group.id}
                        className="text-sm text-muted-foreground line-clamp-1"
                      >
                        👥{" "}
                        <span className="hover:text-blue-600 hover:underline">
                          {group.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  card.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {card.description}
                    </p>
                  )
                )}
              </div>
              <div className="mt-auto pt-4">
                {card.type === "dailyBloom" && blooms.length > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/dashboard/daily-bloom");
                    }}
                    className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    Add Bloom
                  </Button>
                )}
                {card.type === "progressVault" && progressItems.length > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/dashboard/progress-vault");
                    }}
                    className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    Log Progress
                  </Button>
                )}

                {card.type === "miracleLog" && miracleItems.length > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/dashboard/miracle-log");
                    }}
                    className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    Log Miracle
                  </Button>
                )}

                {card.type === "challenges" && challengeItems.length > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/dashboard/challenge?tab=join");
                    }}
                    className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    Join Challenges
                  </Button>
                )}

                {card.type === "mmp" && mmpItems.length > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/dashboard/mini-mastery-programs");
                    }}
                    className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full"
                  >
                    Join MMP
                  </Button>
                )}

                {/* Growth Store Special */}
                {card.action && (
                  <div className="mt-auto space-y-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation(); // prevent card click
                        router.push("/dashboard/store");
                      }}
                      className="w-full text-xs  rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      Redeem Your {jpBalance} GP Now{" "}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
