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

type AlignedAction = {
  id: string;
  completed: boolean;
  selectedTask: string;
  tasks: string[];
  timeFrom: string;
  timeTo: string;
};

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
}: {
  jpBalance: string;
  alignedAction: AlignedAction[];
}) {
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
      queryClient.setQueryData(
        ["dashboard-content"], // ✅ match your query key
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            alignedAction: old.alignedAction.map((a: any) =>
              a.id === actionId ? { ...a, completed: true } : a,
            ),
          };
        },
      );
      toast.success("Task completed 🎉");
    },
  });
  const todayAction = alignedAction?.[0];
  const hasTodayFocus = !!todayAction;

  const task =
    todayAction?.tasks?.find((t: string) => t === todayAction?.selectedTask) ||
    todayAction?.selectedTask;

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
      {dynamicCards.map((card, index) => (
        <Card
          key={index}
          onClick={() => {
            if (index === 0) return; // ❌ disable click for Today’s Focus
            if (card.path) router.push(card.path);
          }}
          className={cn(
            "group relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl border",
            card.highlight
              ? "border-emerald-200 overflow-hidden"
              : "border-gray-200",
          )}
        >
          <CardContent className="p-6">
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
            {index === 0 && hasTodayFocus ? (
              <div className="flex items-center gap-2 text-sm mt-1">
                <Input
                  type="checkbox"
                  checked={isCompleted}
                  disabled={isCompleted || completeActionMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation(); // prevent card click
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
            ) : (
              card.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {card.description}
                </p>
              )
            )}

            {/* Growth Store Special */}
            {card.action && (
              <div className="mt-4 space-y-3">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
