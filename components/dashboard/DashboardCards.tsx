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

type CardItem = {
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
    title: "Set Today’s Focus",
    description:
      "Define your top priorities and stay focused throughout the day",
    icon: TrendingUp,
    bg: "bg-emerald-100 group-hover:bg-emerald-600",
    text: "text-emerald-600 group-hover:text-white",
    path: "/dashboard/aligned-actions",
  },
  {
    title: "Plan the Day",
    description:
      "Organize your schedule clearly and plan tasks with better flow",
    icon: Flower,
    bg: "bg-blue-100 group-hover:bg-blue-600",
    text: "text-blue-600 group-hover:text-white",
    path: "/dashboard/daily-bloom",
  },
  {
    title: "Set Reminders",
    description:
      "Get timely alerts so you never miss important tasks or events",
    icon: BellRing,
    bg: "bg-red-100 group-hover:bg-red-500",
    text: "text-red-500 group-hover:text-white",
    path: "/dashboard/reminders",
  },
  {
    title: "Log 1% Progress",
    description: "Track small daily wins and build consistent growth over time",
    icon: LucideSignalHigh,
    bg: "bg-green-100 group-hover:bg-green-500",
    text: "text-green-700 group-hover:text-white",
    path: "/dashboard/progress-vault",
  },
  {
    title: "Log Miracles",
    description: "Capture meaningful moments and reflect on unexpected wins",
    icon: WandSparklesIcon,
    bg: "bg-indigo-100 group-hover:bg-indigo-500",
    text: "text-indigo-600 group-hover:text-white",
    path: "/dashboard/miracle-log",
  },
  {
    title: "Join Challenges",
    description: "Participate in challenges to stay consistent and grow daily",
    icon: Swords,
    bg: "bg-pink-100 group-hover:bg-pink-500",
    text: "text-pink-600 group-hover:text-white",
    path: "/dashboard/challenge?tab=join",
  },
  {
    title: "Mini Mastery Programs",
    description:
      "Learn new skills with short programs designed for daily growth",
    icon: GraduationCap,
    bg: "bg-gray-200 group-hover:bg-gray-700",
    text: "text-gray-700 group-hover:text-white",
    path: "/dashboard/mini-mastery-programs",
  },
  {
    title: "Growth Store",
    description: "",
    icon: ShoppingCart,
    bg: "bg-gradient-to-br from-emerald-500 to-green-500",
    text: "text-white",
    highlight: true,
    action: true,
    path: "/dashboard/store",
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
}: Props) {
  const router = useRouter();

  const queryClient = useQueryClient();

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
        ["dashboard-content"], // ✅ match your query key
        (old) => {
          if (!old) return old;

          return {
            ...old,
            alignedAction: old.alignedAction.map((a) =>
              a.id === actionId ? { ...a, completed: true } : a,
            ),
          };
        },
      );
      toast.success("Task completed 🎉");
    },
  });

  const updateBloomMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.put(`/api/user/daily-bloom/${id}`, {
        isCompleted: true,
      });
    },

    onSuccess: (_, id) => {
      // ✅ update dashboard-content cache
      queryClient.setQueryData<DashboardContent>(
        ["dashboard-content"],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            dailyBlooms: old.dailyBlooms.map((b) =>
              b.id === id ? { ...b, isCompleted: true } : b,
            ),
          };
        },
      );

      toast.success("Bloom completed ✅");
    },
  });

  const todayAction = alignedAction?.[0];
  const hasTodayFocus = !!todayAction;
  // aligned action tasks
  const task =
    todayAction?.tasks?.find((t: string) => t === todayAction?.selectedTask) ||
    todayAction?.selectedTask;
  // bloooms
  const blooms = dailyBlooms?.slice(0, 3);
  // onePercentProgressVault
  const progressItems = onePercentProgressVault?.slice(0, 3);

  // miracle logs
  const miracleItems = miracleLogs?.slice(0, 3); // keep short like progress
  // challenges
  const challengeItems = challenges?.slice(0, 3);

  // mmp
  const mmpItems = mmpPrograms?.slice(0, 3);

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
    ...cards.slice(1),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {dynamicCards.map((card, index) => {
        const hasCTA =
          (index === 1 && blooms.length > 0) ||
          (index === 3 && progressItems.length > 0) ||
          (index === 4 && miracleItems.length > 0) ||
          (index === 5 && challengeItems.length > 0) ||
          (index === 6 && mmpItems.length > 0) ||
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
            <CardContent className="p-6 flex flex-col h-full">
              {/* Badge */}
              {card.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-600">
                  {card.badge}
                </span>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all",
                  card.bg,
                )}
              >
                <card.icon
                  className={cn(
                    "w-7 h-7 transition-colors duration-300",
                    card.text,
                  )}
                />
              </div>

              {/* Title */}
              <div className="flex items-center justify-between mb-1">
                <h3
                  className={cn(
                    "text-md sm:text-lg font-semibold",
                    card.highlight && "",
                  )}
                >
                  {card.title}
                </h3>

                {/* {card.action && (
                <span className="text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-600 px-1 py-1 rounded-full">
                  {jpBalance} GP Balance
                </span>
              )} */}
              </div>

              {/* Description */}
              <div className="flex flex-col flex-1">
                {index === 0 && hasTodayFocus ? (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={isCompleted || completeActionMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCompleted && todayAction?.id) {
                          completeActionMutation.mutate(todayAction.id);
                        }
                      }}
                      className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    <p className="text-muted-foreground">
                      {task} • {time}
                    </p>
                  </div>
                ) : index === 1 && blooms.length > 0 ? (
                  // ✅ DAILY BLOOMS
                  <div className="flex flex-col gap-2 mt-1">
                    {blooms.map((bloom) => (
                      <div
                        key={bloom.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={bloom.isCompleted}
                          disabled={
                            bloom.isCompleted || updateBloomMutation.isPending
                          }
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!bloom.isCompleted) {
                              updateBloomMutation.mutate(bloom.id);
                            }
                          }}
                          className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                        <p className="text-muted-foreground line-clamp-1">
                          {bloom.title}{" "}
                          {bloom.isFromEvent && (
                            <span className=" text-purple-600 font-medium">
                              (Event)
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : index === 3 && progressItems?.length > 0 ? (
                  // ✅ 1% PROGRESS VAULT
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
                ) : index === 4 && miracleItems?.length > 0 ? (
                  // ✅ MIRACLE LOGS
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
                ) : index === 5 && challengeItems?.length > 0 ? (
                  // ✅ CHALLENGES
                  <div className="flex flex-col gap-2 mt-1">
                    {challengeItems.map((item) => (
                      <Link
                        href={`/dashboard/challenge/my-challenges/${item?.challenge?.id}?from=dashboard`}
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
                ) : index === 6 && mmpItems?.length > 0 ? (
                  // ✅ MMP PROGRAMS
                  <div className="flex flex-col gap-2 mt-1">
                    {mmpItems.map((item) => (
                      <Link
                        href={`/dashboard/mini-mastery-programs/program/${item?.program?.id}?from=dashboard`}
                        key={item.program.id}
                        className="text-sm text-muted-foreground line-clamp-1 "
                      >
                        🎓{" "}
                        <span className="hover:text-blue-600 hover:underline">
                          {item.program.name}
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
                {index === 1 && blooms.length > 0 && (
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
                {index === 3 && progressItems.length > 0 && (
                  <Button className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full">
                    Log Progress
                  </Button>
                )}

                {index === 4 && miracleItems.length > 0 && (
                  <Button className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full">
                    Log Miracle
                  </Button>
                )}

                {index === 5 && challengeItems.length > 0 && (
                  <Button className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full">
                    Join Challenges
                  </Button>
                )}

                {index === 6 && mmpItems.length > 0 && (
                  <Button className="w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded-full">
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
