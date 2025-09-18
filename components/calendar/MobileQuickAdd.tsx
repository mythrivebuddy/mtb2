// components/calendar/MobileQuickAdd.tsx (Improved)

"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/tw"; // Assumes you have a cn utility for classnames

/**
 * Values returned to the parent on save.
 */
export type MobileQuickAddValues = {
  title: string;
  description?: string;
};

interface Props {
  /** Controls visibility from the parent */
  open: boolean;
  /** Close the sheet (parent will set open=false) */
  onClose: () => void;
  /**
   * Called when user taps Save.
   * Can be async to allow for loading states.
   */
  onAdd: (values: MobileQuickAddValues) => Promise<void> | void;
}

/**
 * A minimal, mobile-first “Quick Add” bottom sheet for calendar events.
 * - Improved accessibility with labels.
 * - Auto-focuses the title field for faster input.
 * - Shows a loading state on the Save button during submission.
 */
const MobileQuickAdd: React.FC<Props> = ({ open, onClose, onAdd }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset fields whenever the dialog is closed
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
    }
  }, [open]);

  // Auto-focus the title input when the dialog opens for a better UX
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100); // Delay allows for dialog transition
    }
  }, [open]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSaving(true);
    try {
      await onAdd({ title: trimmedTitle, description: description.trim() || undefined });
      onClose(); // Close only on successful save
    } catch (error) {
      console.error("Failed to add event:", error);
      // Optional: Add toast notification for errors
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Prevent closing the dialog while an async save is in progress
    if (isSaving) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          // Base styles
          "p-0 gap-0",
          // Mobile bottom-sheet styles
          "fixed bottom-0 w-full max-w-none translate-y-0 rounded-t-2xl",
          // Desktop centered-modal styles
          "sm:relative sm:max-w-md sm:rounded-2xl"
        )}
      >
        {/* Visual grabber handle for mobile bottom sheet aesthetic */}
        <div className="absolute left-1/2 top-3 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted sm:hidden" />

        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>

        {/* Form Fields */}
        <div className="grid gap-4 px-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              ref={titleInputRef}
              id="title"
              placeholder="e.g., Team meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
              aria-label="Event Title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add details, links, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              aria-label="Event Description"
              rows={4}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="p-6">
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MobileQuickAdd;