"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { AccountabilityFeedItem } from "@/hooks/useAccountabilityFeed";
import { CalendarClock, CheckCircle2, MessageSquare, PlusCircle } from "lucide-react";

const ICONS: Record<AccountabilityFeedItem["icon"], React.ReactNode> = {
  goal: <PlusCircle className="h-4 w-4 text-slate-600" />,
  update: <CalendarClock className="h-4 w-4 text-slate-600" />,
  result: <CheckCircle2 className="h-4 w-4 text-slate-600" />,
  comment: <MessageSquare className="h-4 w-4 text-slate-600" />,
  cycle: <CalendarClock className="h-4 w-4 text-slate-600" />,
};

export default function ActivityFeed({
  items,
  isLoading,
}: {
  items: AccountabilityFeedItem[];
  isLoading?: boolean;
}) {
  // loading
  if (isLoading) {
    return (
      <ul className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <li key={i} className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-1 rounded-full" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // No items yet
  if (!isLoading && items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity yet — updates will appear here.
      </p>
    );
  }

  // activity items are there
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <div className="mt-1">{ICONS[item.icon]}</div>
          <div>
            <p className="text-sm text-foreground">{item.title.message}</p>
            <p className="text-xs text-muted-foreground">{item.time}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}