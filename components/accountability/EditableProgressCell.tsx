"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {toast} from "sonner"

interface EditableProgressCellProps {
  initialValue: string | null | undefined;
  groupId: string;
  cycleId: string;
  fieldToUpdate: "text" | "midwayUpdate" | "endResult";
  isCurrentUser: boolean;
  placeholderText: string;
  isGoalPrivateToAdmin: "PRIVATE" | "VISIBLE_TO_GROUP" | null;
  isGroupBlocked: boolean;
}

export default function EditableProgressCell({
  initialValue,
  groupId,
  cycleId,
  fieldToUpdate,
  isGoalPrivateToAdmin,
  isCurrentUser,
  placeholderText,
  isGroupBlocked,
}: EditableProgressCellProps) {
  
  const { mutate } = useSWRConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/accountability-hub/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          cycleId,
          field: fieldToUpdate,
          value,
        }),
      });

      if (!response.ok) throw new Error("Failed to save.");

      mutate(`/api/accountability-hub/groups/${groupId}/view`);
      toast.success("Progress saved!");
      setIsEditing(false);
    } catch (error) {
      toast.error((error as Error).message || "Error saving progress.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCurrentUser) {
    return (
      <>
        {initialValue || (
          <span className="px-12">
            <span className="text-muted-foreground text-center">...</span>
          </span>
        )}
      </>
    );
  }

  if (isEditing && !isGroupBlocked) {
    return (
      <form
        onSubmit={(e) => {
          handleSave(e); 
        }}
        className="flex flex-col sm:flex-row sm:items-center gap-2 w-full"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholderText}
          disabled={isLoading}
          className="flex-grow min-w-[150px] w-full sm:w-auto"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
        />

        <div className="flex justify-end sm:justify-start gap-2 flex-shrink-0">
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !value.trim()}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            onClick={() => setIsEditing(false)}
            size="sm"
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-slate-50 p-2 rounded-md min-h-[40px]"
    >
      {isGoalPrivateToAdmin !== "PRIVATE" ? (
        value || <span className="text-muted-foreground">{placeholderText}</span>
      ) : (
        <span className="text-muted-foreground">Private to Admins</span>
      )}
    </div>
  );
}
