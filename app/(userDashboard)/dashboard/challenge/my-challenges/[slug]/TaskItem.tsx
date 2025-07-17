"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

// Define a simple, consistent interface for the task prop.
// This matches the `normalizedTasks` object shape from the page component.
interface SimpleTask {
  id: string;
  description: string;
  isCompleted: boolean;
}

interface TaskItemProps {
  task: SimpleTask;
  isEnrolled: boolean;
}

export function TaskItem({ task, isEnrolled }: TaskItemProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { id, description, isCompleted } = task;

  const handleCompleteTask = async () => {
    // A task can only be completed if the user is enrolled and it's not already done.
    if (!isEnrolled || isCompleted || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      // The API endpoint receives the ID of the UserChallengeTask to update.
      const response = await fetch("/api/challenges/update-task-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userChallengeTaskId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Could not update task.'}`);
      } else {
        // Refresh the page data to show the updated task status
        router.refresh();
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the visual state and interactivity
  const Icon = isCompleted ? CheckCircle : Circle;
  const iconColor = isCompleted ? "text-green-500" : "text-slate-400";
  const canClick = isEnrolled && !isCompleted;

  return (
    <li
      onClick={handleCompleteTask}
      className={`p-4 bg-slate-50 rounded-lg border flex items-center transition-all duration-200 ${
        canClick
          ? "cursor-pointer hover:bg-green-50 hover:border-green-300"
          : "cursor-default"
      } ${isCompleted ? "border-green-200" : "border-slate-200"}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0 animate-spin" />
      ) : (
        <Icon className={`w-5 h-5 ${iconColor} mr-3 flex-shrink-0`} />
      )}
      <p
        className={`text-slate-800 ${
          isCompleted ? "line-through text-slate-500" : ""
        }`}
      >
        {description}
      </p>
    </li>
  );
}
