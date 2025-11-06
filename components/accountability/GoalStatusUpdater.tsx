"use client";

import { useSWRConfig } from "swr";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type Status = "on_track" | "needs_attention" | "off_track";

const statusConfig: Record<Status, { label: string; color: string }> = {
  on_track: { label: "On Track", color: "bg-blue-500 hover:bg-blue-600" },
  needs_attention: {
    label: "Needs Attention",
    color: "bg-yellow-600 hover:bg-yellow-700",
  },
  off_track: { label: "Off Track", color: "bg-red-500 hover:bg-red-700" },
};

interface GoalStatusUpdaterProps {
  goalId: string;
  groupId: string;
  cycleId: string;
  authorId: string;
  currentStatus: Status;
  isAdmin: boolean;
  isGroupBlocked:boolean;
}

export default function GoalStatusUpdater({
  goalId,
  groupId,
  cycleId,
  authorId,
  isGroupBlocked,
  currentStatus,
  isAdmin,
}: GoalStatusUpdaterProps) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();

  const handleStatusChange = async (newStatus: Status) => {
    try {
      const response = await fetch("/api/accountability-hub/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          goalId,
          cycleId,
          authorId,
          field: "status",
          value: newStatus,
        }),
      });
      if (!response.ok) throw new Error("Failed to update status.");
      toast({ title: "Status updated!" });
      mutate(`/api/accountability-hub/groups/${groupId}/view`);
    } catch (error) {
      toast({
        title: (error as Error).message || "Error updating status.",
        variant: "destructive",
      });
    }
  };

  const statusInfo = statusConfig[currentStatus] || statusConfig.on_track;

  // Non-admins just see the badge
  if (!isAdmin || isGroupBlocked) {
    return (
      <Badge
        className={`${statusInfo.color} text-white text-xs flex justify-center text-center`} // <-- MODIFIED HERE
      >
        {statusInfo.label}
      </Badge>
    );
  }

  // Admins get the dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          className={`${statusInfo.color} text-white cursor-pointer text-xs flex justify-center text-center`} // <-- MODIFIED HERE
        >
          {statusInfo.label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.keys(statusConfig).map((statusKey) => (
          <DropdownMenuItem
            key={statusKey}
            onClick={() => handleStatusChange(statusKey as Status)}
            className="text-xs"
          >
            {statusConfig[statusKey as Status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}