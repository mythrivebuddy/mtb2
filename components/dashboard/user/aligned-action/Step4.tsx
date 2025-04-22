"use client";

import React, { useState, useEffect } from "react";
import { useAlignedActionForm } from "@/lib/hooks/useAlignedActionForm";
import { getMoodEmoji } from "@/lib/utils/aligned-action-form";
import moment from "moment";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import CompletionDialog from "./CompletionDialog";

interface Step4Props {
  onBack: () => void;
}

export default function Step4({ onBack }: Step4Props) {
  const { formData, resetForm } = useAlignedActionForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  // const [_,setIsModalActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDailyLimitReached, setIsDailyLimitReached] = useState(false);
  const queryClient = useQueryClient();
  
  // Format the task types for display
  const formatTaskTypes = (types: string[] = []) => {
    if (!types || !Array.isArray(types) || types.length === 0) {
      return "None selected";
    }
    
    return types.map(type => {
      return type
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
    }).join(", ");
  };

  // Validate form data before submission
  const validateFormData = () => {
    if (!formData.step1 || !formData.step1.mood) {
      toast.error("Please complete Step 1: Select your mood");
      return false;
    }
    
    if (!formData.step2 || 
        !formData.step2.taskTypes || 
        formData.step2.taskTypes.length === 0 ||
        !formData.step2.selectedOption) {
      toast.error("Please complete Step 2: Select task types and an option");
      return false;
    }
    
    if (!formData.step3 || 
        !formData.step3.selectedTime || 
        !formData.step3.secondaryTime) {
      toast.error("Please complete Step 3: Select your times");
      return false;
    }
    
    return true;
  };

  // Check if it's time to show the modal
  useEffect(() => {
    if (!actionId || !formData.step3.selectedTime) return;

    // Create a variable to track if this component is still mounted
    let isMounted = true;
    // Store the timeout ID so we can clear it on cleanup
    let timerId: NodeJS.Timeout;

    const checkCompleted = async () => {
      try {
        // Check if the action has already been addressed via localStorage
        const addressedActions = localStorage.getItem('addressedActionIds');
        if (addressedActions) {
          try {
            const parsedIds = JSON.parse(addressedActions);
            if (Array.isArray(parsedIds) && parsedIds.includes(actionId)) {
              return;
            }
          } catch (error) {
            console.error('Error parsing addressed actions:', error);
          }
        }

        // Check if another component is handling this action
        const globalModalActionId = localStorage.getItem('globalModalActionId');
        if (globalModalActionId) {
          return;
        }

        const actionCheckerHandlingId = localStorage.getItem('actionCheckerHandlingActionId');
        if (actionCheckerHandlingId === actionId) {
          return;
        }

        // Make a single API call to check completed status
        const response = await axios.get("/api/aligned-action/completed-today");
        const hasCompletedToday = response.data.hasCompletedToday;
        
        if (hasCompletedToday) {
          return;
        }

        // Calculate time until the action
        const selectedTime = new Date(formData.step3.selectedTime).getTime();
        const now = new Date().getTime();
        const timeUntilAction = selectedTime - now;

        // If the action time is in the past, no need to set a timer
        if (timeUntilAction <= 0) return;

        // Set flags to indicate this component is handling the action
        localStorage.setItem('step4HandlingActionId', actionId);
        localStorage.setItem('globalModalActionId', actionId);

        // Set a single timeout to trigger the modal at the scheduled time
        timerId = setTimeout(() => {
          if (!isMounted) return;
          
          // Before showing modal, verify the action hasn't been handled
          const currentlyHandledId = localStorage.getItem('actionCheckerHandlingActionId');
          if (currentlyHandledId === actionId) {
            return;
          }
          
          try {
            const latestAddressedActions = localStorage.getItem('addressedActionIds');
            if (latestAddressedActions) {
              const parsedIds = JSON.parse(latestAddressedActions);
              if (Array.isArray(parsedIds) && parsedIds.includes(actionId)) {
                return;
              }
            }
          } catch (error) {
            console.error('Error parsing addressed actions:', error);
          }
          
          // Make one final check before showing the modal
          axios.get("/api/aligned-action/completed-today")
            .then(response => {
              if (!isMounted) return;
              if (!response.data.hasCompletedToday) {
                setShowTaskModal(true);
              }
            })
            .catch(error => {
              console.error("Error checking completed actions:", error);
            });
          
        }, timeUntilAction);
      } catch (error) {
        console.error("Error checking completed actions:", error);
      }
    };

    // Run the check once when the component mounts or actionId changes
    checkCompleted();

    // Cleanup function to prevent memory leaks and stop checks when component unmounts
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      localStorage.removeItem('step4HandlingActionId');
      if (localStorage.getItem('globalModalActionId') === actionId) {
        localStorage.removeItem('globalModalActionId');
      }
    };
  }, [actionId, formData.step3.selectedTime]);

  // Update the userInfo data in react-query cache
  const updateJpBalance = (amount: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryClient.setQueryData(['userInfo'], (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        jpBalance: (oldData.jpBalance || 0) + amount,
        jpEarned: (oldData.jpEarned || 0) + amount,
        jpTransaction: (oldData.jpTransaction || 0) + amount
      };
    });
    // Note: We're deliberately not calling invalidateQueries for userInfo
    // to prevent unnecessary server refetches that would cause page refresh updates
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateFormData()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    setIsDailyLimitReached(false);
    
    try {
      const selectedTime = moment(formData.step3.selectedTime).toISOString();
      const secondaryTime = moment(formData.step3.secondaryTime).toISOString();
      
      const submissionData = {
        step1: {
          ...formData.step1,
          notes: Array.isArray(formData.step1.notes) ? formData.step1.notes : ["", "", ""]
        },
        step2: {
          ...formData.step2,
          taskTypes: Array.isArray(formData.step2.taskTypes) ? formData.step2.taskTypes : [],
          selectedOption: formData.step2.selectedOption || ""
        },
        step3: {
          selectedTime,
          secondaryTime
        }
      };
      
      console.log("Sending data to API:", JSON.stringify(submissionData, null, 2));
      
      const response = await axios.post("/api/aligned-action", submissionData);
      
      setActionId(response.data.actionId);
      
      // Immediately update JP balance for instant feedback (add 50 JP)
      updateJpBalance(50);
      
      toast.success("Action scheduled successfully! You've earned +50 Joy Pearls!");
      
      setSubmitted(true);
      resetForm();
      
    } catch (error) {
      console.error("Submission error details:", error);
      
     if(error instanceof AxiosError) {if (error.response?.status === 400) {
        const message = error.response?.data?.message || "You can only create one aligned action per day.";
        setIsDailyLimitReached(true);
        setErrorMessage(message);
        console.log("Daily limit reached:", message);
      } else {
        const errorMessage = error.response?.data?.message || 
                         "Failed to submit. Please check your connection and try again.";
        setErrorMessage(errorMessage);
        toast.error(errorMessage);
        
        if (error.response?.status === 500) {
          console.error("Server error response:", error.response?.data);
          toast.error("Server error. Please try again later or contact support.");
        }
      }}
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Yes/No response in the modal
  const handleModalResponse = async (completed: boolean) => {
    if (!actionId) return;
    
    // setIsModalActionLoading(true);
    
    try {
      // Update the aligned action status - this endpoint already creates Progress Vault entries
      const response = await axios.patch("/api/aligned-action", {
        actionId,
        completed
      });
      
      // Check if daily limit was reached
      if (completed) {
        if (response.data.dailyLimitReached) {
          toast.warning("You have already completed an aligned action today. Daily limit reached.");
        } else {
          // Immediately update JP balance without waiting for page refresh
          updateJpBalance(50);
          toast.success("Congratulations! You've earned +50 Joy Pearls!");
          
          // Still invalidate the Progress Vault data as it needs to be refreshed
          queryClient.invalidateQueries({ queryKey: ['progressVault'] });
        }
      } else {
        toast.info("You've marked this action as not completed.");
      }
      
      // Store the actionId in localStorage to prevent showing the modal again
      try {
        const addressedActions = localStorage.getItem('addressedActionIds');
        let updatedActions = [];
        
        if (addressedActions) {
          updatedActions = JSON.parse(addressedActions);
        }
        
        // Add the current actionId if it's not already in the list
        if (!updatedActions.includes(actionId)) {
          updatedActions.push(actionId);
          localStorage.setItem('addressedActionIds', JSON.stringify(updatedActions));
        }
      } catch (error) {
        console.error('Error updating addressed actions in localStorage:', error);
      }
      
      // Clear any flags indicating that a modal is being shown
      localStorage.removeItem('step4HandlingActionId');
      localStorage.removeItem('globalModalActionId');
      
      setShowTaskModal(false);
    } catch (error) {
      const errorMessage = error instanceof AxiosError 
        ? error.response?.data?.message 
        : "Failed to update action status. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating action:", error);
      // Clear flags even on error
      localStorage.removeItem('step4HandlingActionId');
      localStorage.removeItem('globalModalActionId');
    } finally {
      // setIsModalActionLoading(false);
    }
  };

  // If there's a daily limit error, show an error UI
  if (isDailyLimitReached) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Daily Limit Reached</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-auto max-w-md mb-6">
          <p className="text-blue-700">
            {errorMessage || "You can only create one aligned action per day."}
          </p>
        </div>
        <p className="text-gray-600 mb-6">
          Please come back tomorrow to create a new aligned action.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // If the form has been submitted, show a confirmation
  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Success!</h2>
        <p className="text-gray-600 mb-6">
          Your aligned action has been submitted. You will receive an email reminder 5 minutes before your scheduled time.
        </p>
        <p className="text-sm text-gray-500">
          You will earn +50 Joy Pearls upon completing this action.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="text-xl font-semibold mb-6">Step 4: Review & Submit</div>
        
        {errorMessage && !isDailyLimitReached && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{errorMessage}</p>
          </div>
        )}
        
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-medium">Mood & Notes</h3>
            <div className="mt-3 flex items-center">
              <span className="text-3xl mr-3">
                {getMoodEmoji(formData.step1.mood)}
              </span>
              <span className="capitalize">{formData.step1.mood}</span>
            </div>
            <div className="mt-3 space-y-2">
              {formData.step1.notes && Array.isArray(formData.step1.notes) ? 
                formData.step1.notes.map((note, index) => (
                  <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                    {note || <span className="italic text-gray-400">No note</span>}
                  </div>
                )) : <div className="text-sm bg-gray-50 p-2 rounded">
                      <span className="italic text-gray-400">No notes provided</span>
                    </div>
              }
            </div>
          </div>

          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-medium">Summary & Task Type</h3>
            <div className="mt-2">
              <div className="font-medium text-sm text-gray-700">Summary Type:</div>
              <div className="mt-1">{formData.step2.selectedOption || "None selected"}</div>
            </div>
            <div className="mt-3">
              <div className="font-medium text-sm text-gray-700">Task Types:</div>
              <div className="mt-1">{formatTaskTypes(formData.step2.taskTypes)}</div>
            </div>
            <div className="mt-3">
              <div className="font-medium text-sm text-gray-700">Selected Option:</div>
              <div className="mt-1">{formData.step2.selectedOption || "None selected"}</div>
            </div>
          </div>

          <div className="px-6 py-4">
            <h3 className="text-lg font-medium">Selected Times</h3>
            <div className="mt-2 space-y-3">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-medium">Primary Time: </span>
                  <span>
                    {formData.step3.selectedTime ? 
                      moment(formData.step3.selectedTime).format("MMM D, YYYY [at] h:mm A") : 
                      "No time selected"}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-medium">Secondary Time: </span>
                  <span>
                    {formData.step3.secondaryTime ? 
                      moment(formData.step3.secondaryTime).format("MMM D, YYYY [at] h:mm A") : 
                      "No time selected"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You will receive an email reminder 5 minutes before your scheduled time</li>
                <li>At the scheduled time, you will be prompted to confirm if you completed the task</li>
                <li>If completed, you will earn +50 Joy Pearls and the task will be saved to your Progress Vault</li>
                <li><span className="font-semibold">Remember:</span> You can only create one aligned action per day</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md ${
              isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } transition-colors`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
      
      {/* Task completion modal */}
      {actionId && showTaskModal && (
        <CompletionDialog
          isOpen={showTaskModal}
          onClose={(wasCompleted) => handleModalResponse(wasCompleted)}
          actionData={{
            id: actionId,
            mood: formData.step1.mood,
            notes: formData.step1.notes.filter((note): note is string => !!note),
            summaryType: "",
            taskTypes: formData.step2.taskTypes,
            scheduledTime: formData.step3.selectedTime.toString(),
            secondaryTime: formData.step3.secondaryTime.toString(),
            selectedOption: formData.step2.selectedOption
          }}
        />
      )}
    </>
  );
}