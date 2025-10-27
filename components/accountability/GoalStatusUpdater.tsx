// components/accountability/GoalStatusUpdater.tsx
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
  // in_progress: { label: "In Progress", color: "bg-purple-500 hover:bg-purple-700" },
};

interface GoalStatusUpdaterProps {
  goalId: string;
  groupId: string;
  cycleId: string;
  currentStatus: Status;
  isAdmin: boolean;
}

export default function GoalStatusUpdater({
  //goalId,
  groupId,
  cycleId,
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
          cycleId,
          field: "status",
          value: newStatus,
        }),
      });
      if (!response.ok) throw new Error("Failed to update status.");
      toast({ title: "Status updated!" });
      mutate(`/api/accountability-hub/groups/${groupId}/view`);
    } catch (error) {
      toast({
        title: (error as Error).message || "Error searching users.",
        variant: "destructive",
      });
    }
  };

  const statusInfo = statusConfig[currentStatus] || statusConfig.on_track;
  console.log({ statusConfig });
  if (!isAdmin) {
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  }
  console.log({ statusConfig });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge className={`${statusInfo.color} text-white cursor-pointer`}>
          {statusInfo.label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.keys(statusConfig).map((statusKey) => (
          <DropdownMenuItem
            key={statusKey}
            onClick={() => handleStatusChange(statusKey as Status)}
          >
            {statusConfig[statusKey as Status].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
