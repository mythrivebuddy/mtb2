// components/accountability/EditableGoalCell.tsx
"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";

interface EditableGoalCellProps {
  goal: { id: string; text: string } | undefined;
  memberId: string;
  groupId: string;
  cycleId: string;
  isCurrentUser: boolean;
}

export default function EditableGoalCell({
  goal,
  groupId,
  cycleId,
  isCurrentUser,
}: EditableGoalCellProps) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [goalText, setGoalText] = useState(goal?.text || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!goalText.trim()) {
      toast({ title: "Goal cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/accountability-hub/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, cycleId, goalText }),
      });

      if (!response.ok) throw new Error("Failed to save goal.");

      // After saving, tell SWR to re-fetch the members data to show the update
      mutate(`/api/accountability-hub/groups/${groupId}/members`);
      toast({ title: "Goal saved successfully!" });
      setIsEditing(false);

    } catch (error) {
     toast({ title: (error as Error).message || "Error searching users.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCurrentUser) {
    return <>{goal?.text || <span className="text-muted-foreground">Not set</span>}</>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="Set your goal..."
          disabled={isLoading}
        />
        <Button onClick={handleSave} size="sm" disabled={isLoading}>
          {isLoading ? "..." : "Save"}
        </Button>
        <Button onClick={() => setIsEditing(false)} size="sm" variant="outline" disabled={isLoading}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-slate-50 p-2 rounded-md min-h-[40px]"
    >
      {goal?.text || <span className="text-muted-foreground">Click to set goal</span>}
    </div>
  );
}