// components/accountability/EditableProgressCell.tsx
"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EditableProgressCellProps {
  initialValue: string | null | undefined;
  groupId: string;
  cycleId: string;
  fieldToUpdate: "text" | "midwayUpdate" | "endResult";
  isCurrentUser: boolean;
  placeholderText: string;
  isGoalPrivateToAdmin: "PRIVATE" | "VISIBLE_TO_GROUP" | null;
}

export default function EditableProgressCell({
  initialValue,
  groupId,
  cycleId,
  fieldToUpdate,
  isGoalPrivateToAdmin,
  isCurrentUser,
  placeholderText,
}: EditableProgressCellProps) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || "");
  const [isLoading, setIsLoading] = useState(false);
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/accountability-hub/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          cycleId,
          field: fieldToUpdate,
          value: value,
        }),
      });

      if (!response.ok) throw new Error("Failed to save.");

      mutate(`/api/accountability-hub/groups/${groupId}/view`);
      toast({ title: "Progress saved!" });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: (error as Error).message || "Error searching users.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCurrentUser) {
    return (
      <>{initialValue || <span className="text-muted-foreground">...</span>}</>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholderText}
          disabled={isLoading}
          className="flex-grow min-w-[150px] w-full sm:w-auto"
        />
        <div className="flex justify-end sm:justify-start gap-2 flex-shrink-0">

        <Button
          onClick={handleSave}
          size="sm"
          disabled={isLoading || !value.trim()}
        >
          {isLoading ? "..." : "Save"}
        </Button>
        <Button
          onClick={() => setIsEditing(false)}
          size="sm"
          variant="outline"
          disabled={isLoading}
        >
          Cancel
        </Button>
          </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-slate-50 p-2 rounded-md min-h-[40px]"
    >
      {isGoalPrivateToAdmin != "PRIVATE" ? (
        value || (
          <span className="text-muted-foreground">{placeholderText}</span>
        )
      ) : (
        <span className="text-muted-foreground">Private to Admins</span>
      )}
    </div>
  );
}
