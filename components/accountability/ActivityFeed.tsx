"use client";

import { CalendarClock, CheckCircle2, MessageSquare, PlusCircle } from "lucide-react";
import { AccountabilityFeedItem } from "@/hooks/useAccountabilityFeed";

const ICONS: Record<AccountabilityFeedItem["icon"], JSX.Element> = {
  goal: <PlusCircle className="h-4 w-4 text-slate-600" />,
  update: <CalendarClock className="h-4 w-4 text-slate-600" />,
  result: <CheckCircle2 className="h-4 w-4 text-slate-600" />,
  comment: <MessageSquare className="h-4 w-4 text-slate-600" />,
  cycle: <CalendarClock className="h-4 w-4 text-slate-600" />,
};

export default function ActivityFeed({ items }: { items: AccountabilityFeedItem[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet. Updates will appear here.</p>;
  }
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <div className="mt-1">{ICONS[item.icon]}</div>
          <div>
            <p className="text-sm text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.time}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}


