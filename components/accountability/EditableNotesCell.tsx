"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

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

  const { mutate } = useSWRConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialValue || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.success("Notes cannot be empty.");
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
      toast.success("Notes updated successfully! 📝");
      setIsEditing(false);
    } catch (error) {
      toast.error((error as Error).message || "Error updating notes.");
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
      <form onSubmit={handleSave} className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter notes"
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
          className="flex-grow min-w-[150px]"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            type="submit"
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
      </form>
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
