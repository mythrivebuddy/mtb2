"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSWRConfig } from "swr";
import { useToast } from "@/hooks/use-toast";

interface EditableNotesCellProps {
  goalId: string;
  groupId: string;
  initialValue: string;
  canEdit: boolean; // ✅ new prop
}

export default function EditableNotesCell({
  goalId,
  groupId,
  initialValue,
  canEdit,
}: EditableNotesCellProps) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialValue || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!notes.trim()) {
      toast({ title: "Notes cannot be empty.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/accountability-hub/goals/${goalId}/update-notes`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      );

      if (!response.ok) throw new Error("Failed to update notes.");

      await mutate(`/api/accountability-hub/groups/${groupId}/view`);
      toast({ title: "Notes updated successfully! 📝" });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: (error as Error).message || "Error updating notes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Read-only for members
  if (!canEdit) {
    return (
      <div className="p-2 rounded-md min-h-[40px] text-sm bg-slate-50/50">
        {notes ? notes : <span className="text-muted-foreground">No notes yet</span>}
      </div>
    );
  }

  // ✅ Editable for admins
  if (isEditing) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter notes"
          disabled={isLoading}
          className="flex-grow min-w-[150px]"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading || !notes.trim()}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setNotes(initialValue || "");
            }}
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
      onClick={() => canEdit && setIsEditing(true)}
      className={`p-2 rounded-md min-h-[40px] cursor-${
        canEdit ? "pointer hover:bg-slate-50" : "default"
      }`}
    >
      {notes ? (
        <span>{notes}</span>
      ) : (
        <span className="text-muted-foreground">
          {canEdit ? "Click to add notes" : "No notes yet"}
        </span>
      )}
    </div>
  );
}
