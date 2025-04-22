"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import moment from "moment";
import { getMoodEmoji } from "@/lib/utils/aligned-action-form";
import { useQueryClient } from "@tanstack/react-query";

interface CompletionDialogProps {
  isOpen: boolean;
  onClose: (wasCompleted: boolean) => void;
  actionData: {
    id: string;
    mood: string;
    notes: string[];
    summaryType: string;
    taskTypes: string[];
    scheduledTime: string;
    secondaryTime?: string;
    selectedOption?: string;
  };
}

export default function CompletionDialog({
  isOpen,
  onClose,
  actionData,
}: CompletionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReachedDailyLimit, setHasReachedDailyLimit] = useState(false);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  // Format the task types for display
  const formatTaskTypes = (types: string[]) => {
    if (!types || !Array.isArray(types) || types.length === 0) {
      return "None selected";
    }

    return types
      .map((type) => {
        return type
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
      })
      .join(", ");
  };

  // Update the userInfo data in react-query cache
  const updateJpBalance = (amount: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryClient.setQueryData(["userInfo"], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        jpBalance: (oldData.jpBalance || 0) + amount,
        jpEarned: (oldData.jpEarned || 0) + amount,
        jpTransaction: (oldData.jpTransaction || 0) + amount,
      };
    });
  };

  // Handle completion response
  const handleCompletion = async (completed: boolean) => {
    setIsSubmitting(true);

    try {
      const response = await axios.patch("/api/aligned-action", {
        actionId: actionData.id,
        completed,
      });

      if (completed) {
        if (response.data.dailyLimitReached) {
          setHasReachedDailyLimit(true);
          toast.info(
            "You have already completed your daily aligned action and earned 50 Joy Pearls today."
          );
        } else {
          updateJpBalance(50);
          toast.success("Congratulations! You've earned +50 Joy Pearls!");
          queryClient.invalidateQueries({ queryKey: ["progressVault"] });
        }
      } else {
        toast.info("You've marked this action as not completed.");
      }

      // Store the actionId in localStorage
      try {
        const addressedActions = localStorage.getItem("addressedActionIds");
        const updatedActions = addressedActions
          ? JSON.parse(addressedActions)
          : [];

        if (!updatedActions.includes(actionData.id)) {
          updatedActions.push(actionData.id);
          localStorage.setItem(
            "addressedActionIds",
            JSON.stringify(updatedActions)
          );
        }
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }

      // Clear modal flags
      localStorage.removeItem("globalModalActionId");

      onClose(completed);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (
          error.response?.status === 400 &&
          (error.response?.data?.message?.includes("daily limit") ||
            error.response?.data?.message?.includes(
              "one aligned action per day"
            ))
        ) {
          setHasReachedDailyLimit(true);
          toast.info(
            "You can only complete one aligned action per day and earn 50 Joy Pearls per day."
          );
        } else {
          const errorMessage =
            error.response?.data?.message || "Failed to update action status.";
          toast.error(errorMessage);
          console.error("Error updating action:", error);
        }
      }

      localStorage.removeItem("globalModalActionId");
      onClose(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel/close without responding
  const handleCancel = () => {
    localStorage.removeItem("actionCheckerHandlingActionId");
    localStorage.removeItem("globalModalActionId");
    onClose(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleCancel}
      />

      {/* Dialog content */}
      <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 z-10 transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-md mb-3">
            <span className="text-2xl">
              {getMoodEmoji(
                actionData.mood as
                  | "Sleepy"
                  | "Good To Go"
                  | "Motivated"
                  | "Highly Motivated"
              )}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Your Aligned Action Moment!
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {moment(actionData.scheduledTime).format("h:mm A")} - Time to check
            in on your action.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-100 shadow-sm">
          <h3 className="font-medium text-gray-800 mb-2">Action Details</h3>
          <div className="text-sm text-gray-600 mb-2 flex items-center">
            <span className="text-lg mr-2">
              {getMoodEmoji(actionData.mood as "Sleepy" | "Good To Go" | "Motivated" | "Highly Motivated")}
            </span>
            <span className="capitalize">{actionData.mood}</span>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Task types:</span>{" "}
            {formatTaskTypes(actionData.taskTypes)}
          </div>
          {actionData.selectedOption && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Selected option:</span>{" "}
              {actionData.selectedOption}
            </div>
          )}
          {actionData.secondaryTime && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Secondary time:</span>{" "}
              {moment(actionData.secondaryTime).format("h:mm A")}
            </div>
          )}
          <div className="text-sm mt-2">
            <span className="font-medium">Notes:</span>
            {actionData.notes && actionData.notes.length > 0 ? (
              <ul className="list-disc list-inside mt-1 text-gray-600">
                {actionData.notes.map((note, index) => (
                  <li key={index} className="mb-1">
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 mt-1">No notes provided</p>
            )}
          </div>
        </div>

        <div className="text-center mb-4">
          <h3 className="font-medium text-gray-800 mb-2">
            Did you complete this action?
          </h3>
          <p className="text-sm text-gray-500">
            Complete it to earn +50 Joy Pearls and save it to your Progress
            Vault!
          </p>

          {hasReachedDailyLimit && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-sm font-medium">
                Note: Only one aligned action can be completed per day for 50
                Joy Pearls.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-3">
          <button
            onClick={() => handleCompletion(true)}
            disabled={isSubmitting || hasReachedDailyLimit}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isSubmitting || hasReachedDailyLimit
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md"
            }`}
          >
            Yes, Completed
          </button>
          <button
            onClick={() => handleCompletion(false)}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isSubmitting
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md"
            }`}
          >
            No, Not Yet
          </button>
        </div>
      </div>
    </div>
  );
}
