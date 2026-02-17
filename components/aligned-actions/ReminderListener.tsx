"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlignedAction } from "@/types/client/align-action";
import { useState } from "react";
import { toast } from "sonner";

export default function ReminderListener({
  action,
  open,
  onClose,
  onSnooze,
  onComplete,
}: {
  action: AlignedAction;
  open: boolean;
  onClose: () => void;
  onSnooze: () => void;
  onComplete: () => void;
}) {
  // ADD inside component
  const [snoozeLoading, setSnoozeLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "sleep":
        return "😴";
      case "goodToGo":
        return "😐";
      case "motivated":
        return "😊";
      case "highlyMotivated":
        return "😃";
      default:
        return "";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "creative":
        return "Creative";
      case "nurturing":
        return "Nurturing";
      case "revenueGenerating":
        return "Revenue Generating";
      case "admin":
        return "Administrative";
      default:
        return category;
    }
  };
  // CHANGE handlers
  const handleSnooze = async () => {
    setSnoozeLoading(true);
    try {
      await onSnooze();
      toast.success("Reminder snoozed for 5 minutes ⏱️");
      onClose();
    } catch {
      toast.error("Failed to snooze reminder");
    } finally {
      setSnoozeLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleteLoading(true);
    try {
      await onComplete();
      toast.success("Task marked as completed 🎉");
    } catch {
      toast.error("Failed to mark task as completed");
    } finally {
      setCompleteLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-lg border border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span className="text-2xl">{getMoodEmoji(action.mood)}</span>
            Your 1% Start Action Awaits!
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Its time to tackle your scheduled task. Lets make it happen!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <div className="bg-green-500/10 p-3 rounded-md">
            <p className="font-bold text-green-500 text-sm">
              {action.selectedTask}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(action.timeFrom), "h:mm a")} -{" "}
              {format(new Date(action.timeTo), "h:mm a")}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
              Category
            </h4>
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-green-500"></span>
              {getCategoryLabel(action.category)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <Button
            variant="outline"
            onClick={handleSnooze}
            disabled={snoozeLoading || completeLoading}
            className="px-4 py-1 text-sm text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400 shadow-sm rounded-md"
          >
            {snoozeLoading ? "Snoozing..." : "Remind in 5 Min"}
          </Button>
          <Button
            onClick={handleComplete}
            disabled={snoozeLoading || completeLoading}
            className="px-4 py-1 text-sm bg-green-500 text-white hover:bg-green-600 shadow-md rounded-md"
          >
            {completeLoading ? "Marking..." : "I have completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
